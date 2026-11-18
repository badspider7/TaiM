import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

async function waitFor(js, expression) {
  for (let i = 0; i < 80; i++) {
    if (await js(expression))
      return
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  throw new Error(`UI did not settle: ${expression}`)
}

export async function openSelect(js, label) {
  await js(`(() => {
    const trigger = [...document.querySelectorAll('[role="combobox"]')].find(e => e.getAttribute('aria-label') === ${JSON.stringify(label)});
    if (!trigger || trigger.disabled) throw new Error('Select is unavailable');
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  })()`)
  await waitFor(js, '!!document.querySelector(\'[role="listbox"]\')')
}

export async function chooseSelect(js, label, text) {
  await openSelect(js, label)
  await js(`(() => {
    const option = [...document.querySelectorAll('[role="option"]')].find(o => o.textContent.trim() === ${JSON.stringify(text)});
    if (!option) throw new Error('Select option is missing');
    option.focus();
    option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  })()`)
  await waitFor(js, '!document.querySelector(\'[role="listbox"]\')')
}

export async function testSelects(test, { win, js, invoke, waitText, temporary }) {
  await test('Statistics period selectors switch weeks, months and years through component menus', async () => {
    await js('location.hash = \'#/statistics\'')
    await waitText('累计使用时间')
    for (const [tab, label, choice] of [['按周', '统计周范围', '上周'], ['按月', '统计月份', '3月'], ['按年', '统计年份', `${new Date().getFullYear()}年`]]) {
      await js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(tab)}).click()`)
      await waitFor(js, `!!document.querySelector('[aria-label="${label}"]')`)
      await chooseSelect(js, label, choice)
      assert.equal(await js(`document.querySelector('[aria-label="${label}"]').textContent.trim()`), choice)
      assert.equal(await js('!!document.querySelector(\'.chart-element canvas\')'), true)
    }
  })
  await test('Component selects filter application detail and persist category assignments', async () => {
    await invoke('categories:save', null, '下拉验证')
    const category = (await invoke('categories:list')).find(c => c.name === '下拉验证')
    const model = (await invoke('getAppInfo'))[0]
    await js('location.hash = \'#/category\'')
    await waitText('应用归类')
    await waitFor(js, `!![...document.querySelectorAll('[role="combobox"]')].find(e => e.getAttribute('aria-label') === ${JSON.stringify(`${model.name}的分类`)})`)
    await waitFor(js, '![...document.querySelectorAll(\'[role="combobox"]\')].some(e => e.disabled)')
    await chooseSelect(js, `${model.name}的分类`, '下拉验证')
    await waitFor(js, '[...document.querySelectorAll(\'[role="combobox"]\')].some(e => e.textContent.includes(\'下拉验证\'))')
    assert.equal((await invoke('getAppInfo')).find(a => a.id === model.id).categoryId, category.id)
    await js('location.hash = \'#/detail\'')
    await waitText('查询 / 刷新')
    await waitText('代码编辑器')
    await chooseSelect(js, '筛选分类', '下拉验证')
    assert.equal(await js('document.querySelectorAll(\'.data-table tbody tr\').length'), 1)
    await chooseSelect(js, '筛选分类', '未分类')
    assert.equal(await js('[...document.querySelectorAll(\'.data-table tbody tr\')].some(r => r.textContent.includes(\'代码编辑器\'))'), false)
    await chooseSelect(js, '筛选分类', '全部分类')
    await invoke('categories:delete', category.id)
  })
  await test('Select menus match light and dark themes, restore focus with Escape and scroll long lists', async () => {
    const names = Array.from({ length: 24 }, (_, i) => `菜单测试 ${String(i).padStart(2, '0')}`)
    for (const name of names) await invoke('categories:save', null, name)
    await js('location.hash = \'#/\'')
    await waitText('最为频繁')
    await js('location.hash = \'#/detail\'')
    await waitText('查询 / 刷新')
    for (const theme of ['light', 'dark']) {
      await js(`document.documentElement.classList.toggle('dark', ${JSON.stringify(theme === 'dark')})`)
      await openSelect(js, '筛选分类')
      await new Promise(resolve => setTimeout(resolve, 150))
      const style = await js('(() => { const list = document.querySelector(\'[role="listbox"]\'); const r = list.getBoundingClientRect(); return { height: r.height, bottom: r.bottom, viewport: innerHeight, background: getComputedStyle(list).backgroundColor, options: list.querySelectorAll(\'[role="option"]\').length } })()')
      assert.ok(style.height <= 322 && style.bottom <= style.viewport)
      assert.ok(style.options >= 26)
      assert.notEqual(style.background, 'rgba(0, 0, 0, 0)')
      await fs.writeFile(path.join(temporary, `select-${theme}.png`), (await win.webContents.capturePage()).toPNG())
      await js('document.querySelector(\'[role="listbox"]\').dispatchEvent(new KeyboardEvent(\'keydown\', { key: \'Escape\', bubbles: true, cancelable: true }))')
      await waitFor(js, '!document.querySelector(\'[role="listbox"]\')')
      await waitFor(js, 'document.activeElement?.getAttribute(\'aria-label\') === \'筛选分类\'')
    }
    await chooseSelect(js, '筛选分类', names.at(-1))
    assert.ok(await js('document.querySelector(\'[aria-label="筛选分类"]\').textContent.includes(\'菜单测试 23\')'))
    const categories = await invoke('categories:list')
    for (const c of categories.filter(c => names.includes(c.name))) await invoke('categories:delete', c.id)
  })
  await test('Theme select saves immediately and ignored-app suggestions support custom input', async () => {
    await js('location.hash = \'#/setting?tab=common\'')
    await waitText('记住窗口大小')
    await chooseSelect(js, '主题', '浅色')
    await waitFor(js, '!document.documentElement.classList.contains(\'dark\')')
    assert.equal((await invoke('settings:get')).config.common.theme, 'light')
    await chooseSelect(js, '主题', '深色')
    await waitFor(js, 'document.documentElement.classList.contains(\'dark\')')
    await js('location.hash = \'#/setting?tab=behavior\'')
    await waitText('忽略应用')
    await js('(() => { const input = document.querySelector(\'[aria-label="忽略应用"]\'); input.focus(); input.value = \'Editor\'; input.dispatchEvent(new Event(\'input\', { bubbles: true })); })()')
    await waitFor(js, '!!document.querySelector(\'[role="option"]\')')
    await js('document.querySelector(\'[role="option"]\').dispatchEvent(new PointerEvent(\'pointerdown\', { pointerType: \'mouse\', bubbles: true, cancelable: true })); document.querySelector(\'[role="option"]\').click()')
    await waitFor(js, '!document.querySelector(\'[role="listbox"]\')')
    assert.equal(await js('document.querySelector(\'[aria-label="忽略应用"]\').value'), 'Editor')
    await js('(() => { const input = document.querySelector(\'[aria-label="忽略应用"]\'); input.value = \'Custom ignored app\'; input.dispatchEvent(new Event(\'input\', { bubbles: true })); })()')
    await js('[...document.querySelectorAll(\'button\')].find(b => b.textContent.trim() === \'添加\').click()')
    await waitText('Custom ignored app')
    await waitFor(js, '!document.querySelector(\'[aria-label="忽略应用"]\').disabled')
    assert.ok((await invoke('settings:get')).config.actions.ignoredApps.includes('Custom ignored app'))
    assert.equal(await js('document.querySelectorAll(\'datalist, select:not([aria-hidden="true"])\').length'), 0)
  })
}
