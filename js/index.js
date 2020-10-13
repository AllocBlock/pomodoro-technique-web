/* 配置桌面提示 */
var notificationPermitted = (Notification && Notification.permission === 'granted' ? true : false)
if (Notification.permission === 'default'){
    Notification.requestPermission().then(function(result){
        if (result === 'denied') {
            notificationPermitted = false
            return
        }
        if (result === 'granted') {
            notificationPermitted = true
            return
        }
    })
}

/* 计时相关 */
var vmCounter = new Vue({
    el: '#counter-area',
    data: {
        CountText: '计时停止',
        CountTime: 0,
        IsCounting: false,
        StartTick: null,
        IsPaused: false,
        PauseStartTick: null,
        PausedTick: 0,
    },
    methods: {
        // 开始计时
        startCountdown(time){
            this.CountTime = time
            this.StartTick = new Date().getTime()
            if (!this.IsCounting) {
                this.IsCounting = true
                this.render()
            }
        },
        // 停止计时
        stopCountdown(){
            this.countdownFinish()
        },
        // 暂停计时
        pauseCountdown(){
            if (!this.IsCounting || this.IsPaused) return
            this.IsPaused = true
            this.PauseStartTick = new Date().getTime()
        },
        // 继续计时
        resumeCountdown(){
            if (!this.IsCounting || !this.IsPaused) return;
            this.IsPaused = false
            var curTick = new Date().getTime()
            this.PausedTick += curTick - this.PauseStartTick
            this.render()
        },
        // 渲染函数
        render(){
            if(!this.IsCounting || this.IsPaused) return
            if(!this.renderRemainTime()){
                this.IsCounting = false
                setTimeout(this.countdownFinish, 0) // 异步
            }
            window.requestAnimationFrame(this.render)
        },
        // 渲染剩余时间
        renderRemainTime(){
            // 获取剩余时间
            var curTick = new Date().getTime()
            var remainTick = this.CountTime*1000 - (curTick - this.StartTick) + this.PausedTick
            if(remainTick <= 0){
                return false
            }
            this.CountText = formatTime(remainTick)
            return true
        },
        // 完成倒数回调
        countdownFinish(){
            var curTick = new Date().getTime()
            var countTimeStr = formatTime(curTick - this.StartTick)
            if (notificationPermitted){
                var notification = new Notification('番茄工作法 计时结束', {
                    icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
                    body: `已经过去了 ${countTimeStr}`,
                })
            }
            else{
                alert(`计时结束\n已经过去了 ${countTimeStr}`)
            }

            this.IsCounting = this.IsPaused = false
            this.CountTime = this.PausedTick = 0
            this.StartTick = this.PauseStartTick = null
            this.CountText = '计时停止'
        }
    }
})

/* 日程相关 */
var typeName = ["record", "plan"]
var typeList = ["记录", "计划"]
var vmList = new Vue({
    el: '#list-area',
    mounted: function(){
        this.loadData()
    },
    data: {
        Type: 0,
        List: []
    },
    methods: {
        nextType(){
            this.Type = (this.Type + 1) % typeList.length
            this.loadData()
        },
        saveData(){
            switch(this.Type){
                case 0: {
                    localStorage.recordList = this.List ? JSON.stringify(this.List) : []
                    break;
                }
                case 1: {
                    localStorage.planList = this.List ? JSON.stringify(this.List) : []
                    break;
                }
            }
        },
        loadData(){
            switch(this.Type){
                case 0: {
                    this.List = localStorage.recordList ? JSON.parse(localStorage.recordList) : []
                    break;
                }
                case 1: {
                    this.List = localStorage.planList ? JSON.parse(localStorage.planList) : []
                    break;
                }
            }
        },
        addEntry(){
            switch(this.Type){
                case 0: {
                    this.List.splice(0, 0, {
                        time: new Date().getTime(),
                        content: ''
                    })                    
                    break;
                }
                case 1: {
                    this.List.splice(0, 0, {
                        time: new Date().getTime(),
                        content: '',
                        finished: false
                    })
                    break;
                }
            }
            
        },
        deleteEntry(index){
            this.List.splice(index, 1)
        },
        toggleFinishEntry(index){
            this.List[index].finished = !this.List[index].finished
            if (this.Type == 1){
                this.List.sort((a, b) => b.time - a.time)
                this.List.sort((a, b) => {
                    if (a.finished != b.finished) return a.finished ? 1 : -1
                    else return 0
                })
            }
        },
        exportCsv(){
            // 生成csv
            var csv = ""
            switch(this.Type){
                case 0: {
                    for(entry of vmList.$data.List){
                        csv += tickToTimeStr(entry.time) + "," + entry.content + "\n"
                    }
                    var filename = new Date().toLocaleDateString() + "_work.csv"
                    break
                }
                case 1: {
                    for(entry of vmList.$data.List){
                        csv += tickToTimeStr(entry.time) + "," + entry.content + "," +(entry.finished ? "已完成" : "未完成") + "\n"
                    }
                    var filename = new Date().toLocaleDateString() + "_plan.csv"
                    break
                }
                default: {
                    return
                }
            }
            // 下载
            var pom = document.createElement('a')
            pom.setAttribute('href', 'data:text/plain;charset=gbk,' + encodeURIComponent(csv))
            pom.setAttribute('download', filename)
            pom.click()
        },
        clear(){
            if (confirm("确认清空所有数据？"))
            vmList.$data.List = []
        }
    },
    watch: {
        List(){
            this.saveData()
        }
    }
})

// tick转时间字符串
function tickToTimeStr(tick){
    var time = new Date(tick)
    return time.toLocaleDateString() + " " + time.toTimeString().slice(0, 8)
}

// 格式化时间
function formatTime(time){
    // 格式化
    var hours = Math.floor(time / 1000 / 60 / 60)
    time -= hours * 60 * 60 * 1000
    hours %= 24
    var mins = Math.floor(time / 1000 / 60)
    time -= mins * 60 * 1000
    var secs = Math.floor(time / 1000)
    time -= mins * 1000
    //var mss = remainTick
    var result = (hours ? `${hours}时` : '') + (hours || mins ? `${mins}分` : '') + `${secs}秒`
    return result
}