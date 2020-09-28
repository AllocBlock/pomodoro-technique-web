/* 计时相关 */
var countTime = 0
var startTick = null

// 开始计时
function startCountdown(time){
    countTime = time
    startTick = new Date().getTime()
    if (!isCounting) {
        isCounting = true
        render()
    }
}

var isCounting = false

// 渲染
function render(){
    if(!isCounting) return
    if(!renderRemainTime()){
        isCounting = false
        setTimeout(countdownFinish, 0)
    }
    window.requestAnimationFrame(render)
}

// 渲染剩余时间
function renderRemainTime(){
    // 获取剩余时间
    var curTick = new Date().getTime()
    var remainTick = countTime*1000 - (curTick - startTick)
    if(remainTick <= 0){
        return false
    }
    
    $("#remain-time").text(formatTime(remainTick))
    return true
}

// 配置桌面提示
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

// 完成倒数回调
function countdownFinish(){
    var countTimeStr = formatTime(countTime*1000)
    if (notificationPermitted){
        var notification = new Notification('番茄工作法 计时结束', {
            icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
            body: `已经过去了 ${countTimeStr}`,
        })
    }
    else{
        alert(`计时结束\n已经过去了 ${countTimeStr}`)
    }
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
            console.log("saved")
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
            console.log("add")
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
        },
        exportCsv(){
            // 生成csv
            var csv = ""
            for(entry of vmList.$data.List){
                csv += tickToTimeStr(entry.time) + "," + entry.content + "\n"
            }
            switch(this.Type){
                case 0: {
                    var filename = new Date().toLocaleDateString() + "_work.csv"
                    break;
                }
                case 1: {
                    var filename = new Date().toLocaleDateString() + "_plan.csv"
                    break;
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


function tickToTimeStr(tick){
    var time = new Date(tick)
    return time.toLocaleDateString() + " " + time.toTimeString().slice(0, 8)
}