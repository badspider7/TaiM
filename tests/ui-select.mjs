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

function contrast(foreground, background) {
  const luminance = rgb => rgb.match(/\d+/g).slice(0, 3).map(Number)
    .map(value => value / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

export async function testSelects(test, { win, js, invoke, waitText, temporary, appFixture }) {
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
    const model = (await invoke('getAppInfo')).find(app => app.file === appFixture.file)
    assert.ok(model?.alias)
    await js('location.hash = \'#/category\'')
    await waitText('应用归类')
    await waitFor(js, `!![...document.querySelectorAll('[role="combobox"]')].find(e => e.getAttribute('aria-label') === ${JSON.stringify(`${model.name}的分类`)})`)
    await waitFor(js, '![...document.querySelectorAll(\'[role="combobox"]\')].some(e => e.disabled)')
    await chooseSelect(js, `${model.name}的分类`, '下拉验证')
    await waitFor(js, '[...document.querySelectorAll(\'[role="combobox"]\')].some(e => e.textContent.includes(\'下拉验证\'))')
    assert.equal((await invoke('getAppInfo')).find(a => a.id === model.id).categoryId, category.id)
    await js('location.hash = \'#/detail\'')
    await waitText('查询 / 刷新')
    const fixtureDate = appFixture.startTime.slice(0, 10)
    await js(`(() => {
      const form = document.querySelector('form[aria-label="日期范围"]');
      for (const input of form.querySelectorAll('input[type="date"]')) {
        input.value = ${JSON.stringify(fixtureDate)};
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      form.requestSubmit();
    })()`)
    const hasApp = `[...document.querySelectorAll('.data-table tbody tr')].some(row => row.textContent.includes(${JSON.stringify(model.alias)}))`
    await waitFor(js, hasApp)
    await chooseSelect(js, '筛选分类', '下拉验证')
    assert.equal(await js('document.querySelectorAll(\'.data-table tbody tr\').length'), 1)
    await chooseSelect(js, '筛选分类', '未分类')
    assert.equal(await js(hasApp), false)
    await chooseSelect(js, '筛选分类', '全部分类')
    await invoke('categories:delete', category.id)
  })
  await test('Select menus match light and dark themes, restore focus with Escape and scroll long lists', async () => {
    const names = Array.from({ length: 24 }, (_, i) => `菜单测试 ${String(i).padStart(2, '0')}`)
    for (const name of names) await invoke('categories:save', null, name)
    await js('location.hash = \'#/\'')
    await waitText('使用时长排行')
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
  await test('Switching themes keeps navigation and window controls legible on hover and focus', async () => {
    await js('location.hash = \'#/setting?tab=common\'')
    await waitText('记住窗口大小')
    const rememberSize = (await invoke('settings:get')).config.common.keepWindowSize
    for (const expected of [!rememberSize, rememberSize]) {
      await js('document.getElementById(\'remember-window\').click()')
      await waitFor(js, `document.getElementById('remember-window').getAttribute('aria-checked') === '${expected}' && !document.getElementById('remember-window').disabled`)
      assert.equal((await invoke('settings:get')).config.common.keepWindowSize, expected)
    }
    const debuggerClient = win.webContents.debugger
    debuggerClient.attach('1.3')
    try {
      await debuggerClient.sendCommand('DOM.enable')
      await debuggerClient.sendCommand('CSS.enable')
      const { root } = await debuggerClient.sendCommand('DOM.getDocument')
      for (const selector of ['.sidebar-link[href="#/statistics"]', '.window-control']) {
        const { nodeId } = await debuggerClient.sendCommand('DOM.querySelector', { nodeId: root.nodeId, selector })
        await debuggerClient.sendCommand('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover', 'focus-visible'] })
      }
      for (const [theme, label] of [['light', '浅色'], ['dark', '深色']]) {
        await chooseSelect(js, '主题', label)
        await waitFor(js, `document.documentElement.classList.contains('dark') === ${theme === 'dark'}`)
        assert.equal((await invoke('settings:get')).config.common.theme, theme)
        const [sidebar, windowControl] = await js(`['.sidebar-link[href="#/statistics"]', '.window-control'].map(selector => {
          const control = document.querySelector(selector);
          const { backgroundColor, color, outlineStyle } = getComputedStyle(control);
          return { backgroundColor, color, outlineStyle, fill: getComputedStyle(control.querySelector('svg path, svg rect')).fill };
        })`)
        for (const item of [sidebar, windowControl]) {
          assert.equal(item.backgroundColor.startsWith('rgb('), true)
          assert.ok(contrast(item.color, item.backgroundColor) >= 4.5)
          assert.equal(item.outlineStyle, 'solid')
          assert.equal(item.fill, item.color)
        }
        const navigation = await js(`(() => {
          const active = document.querySelector('.sidebar-link.is-active');
          const website = document.querySelector('.sidebar-link[href="#/websites"] svg');
          return { selected: active.textContent.trim(), selectedFill: getComputedStyle(active.querySelector('path')).fill, selectedColor: getComputedStyle(active).color, selectedBackground: getComputedStyle(active).backgroundColor, websiteFill: getComputedStyle(website).fill, websiteStroke: getComputedStyle(website).stroke, websiteColor: getComputedStyle(website).color };
        })()`)
        assert.equal(navigation.selected, '设置')
        assert.equal(navigation.selectedFill, navigation.selectedColor)
        assert.notEqual(navigation.selectedBackground, sidebar.backgroundColor)
        assert.equal(navigation.websiteFill, 'none')
        assert.equal(navigation.websiteStroke, navigation.websiteColor)
        await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
        await fs.writeFile(path.join(temporary, `navigation-${theme}.png`), (await win.webContents.capturePage()).toPNG())
      }
    }
    finally {
      debuggerClient.detach()
    }
  })
  await test('Ignored-app suggestions support custom input', async () => {
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
