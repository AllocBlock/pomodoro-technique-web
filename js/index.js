/* 计时相关 */
var countTime = 0
var startTick = null
function startCountdown(time){
    countTime = time
    startTick = new Date().getTime()
    if (!isCounting) {
        isCounting = true
        render()
    }
}

var isCounting = false
function render(){
    if(!isCounting) return
    if(!renderRemainTime()){
        isCounting = false
        setTimeout(countdownFinish, 0)
    }
    window.requestAnimationFrame(render)
}

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
var vmList = new Vue({
    el: '#list-area',
    mounted: function(){
        this.loadData()
    },
    data: {
        List: []
    },
    methods: {
        saveData(){
            console.log("saved")
            localStorage.List = this.List ? JSON.stringify(this.List) : []
        },
        loadData(){
            this.List = localStorage.List ? JSON.parse(localStorage.List) : []
        },
        addEntry(){
            console.log("add")
            this.List.splice(0, 0, {
                time: new Date().getTime(),
                content: ''
            })
        },
        deleteEntry(index){
            this.List.splice(index, 1)
        },
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

function exportCsv(){
    // 生成csv
    var csv = ""
    for(entry of vmList.$data.List){
        csv += tickToTimeStr(entry.time) + "," + entry.content + "\n"
    }
    var filename = new Date().toLocaleDateString() + "_work.csv"
    // 下载
    var pom = document.createElement('a')
    pom.setAttribute('href', 'data:text/plain;charset=gbk,' + encodeURIComponent(csv))
    pom.setAttribute('download', filename)
    pom.click()
}

function clear(){
    if (confirm("确认清空所有数据？"))

    vmList.$data.List = []
}