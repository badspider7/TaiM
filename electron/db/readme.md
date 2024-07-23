### 统计时间 目前 一共有三张表

分别是：
 AppModels --》  总的app使用时间表   --》  汇总了每个app的总共使用时间

HoursLogModels --》  每个app的每个小时时间表 --》  其中 appModelId 表示着 AppModels 里面的 key id，用来连接 appModels 表 ，不同的id 代表着 不同的app

DayLogModels --》  每个app的每天使用时间表 --》 其中 appModelId 表示着 AppModels 里面的 key id，用来连接 appModels 表 ，不同的id 代表着 不同的app

### 统计时间的逻辑
1. 获取当前鼠标的焦点窗口
2. 拿到当前焦点窗口的相关信息
3. 每过一秒加1
4. 当鼠标焦点窗口发生变化的时候，把当前窗口的信息存入到 HoursLogModels 表中，并且把当前窗口的累计时间加1
5. 当一天结束的时候，把 HoursLogModels 表中所有的数据存入到 DayLogModels 表中，并且删除 HoursLogModels 表中所有的数据

### 查询时间的逻辑
1. 查询 AppModels 表，获取所有的app信息
2. 查询 DayLogModels 表，获取每个app每天的使用时间
3. 查询 HoursLogModels 表，获取每个app每个小时的使用时间
