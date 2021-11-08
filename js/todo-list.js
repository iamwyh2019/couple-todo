const Todo = {
    data() {
        var checkTime = (rule, value, callback) => {
            if (this.form.time1 === ''){
                callback(new Error('请先选择开始时间'));
            }
            else if (value === ''){
                callback(new Error('请选择结束时间'));
            }
            else {
                let startTime = new Date(this.form.time1)
                let endTime = new Date(value);
                if (startTime >= endTime) {
                    callback(new Error('结束时间不得早于开始时间'));
                }
                else {
                    callback();
                }
            }
        }
        return {
            svgWidth: 0,
            username: "lanran",
            addingEvent: false,
            sendingEvent: false,
            showingEvents: false,
            backTodayTipPop: false,
            todayText: '',
            todayEventTitle: '今天的日程',
            offset: 0,
            eventData: {
                lanran: [],
                xiaowu: [],
            },
            themeColor: {
                lanran: '#6EA8FE',
                xiaowu: 'lightpink'
            },
            timezone: {
                lanran: -6,
                xiaowu: +8
            },
            form: {
                date: '',
                time1: '',
                time2: '',
                name: 'lanran',
                freq: 'once',
                validate: '',
            },
            rules: {
                date: [{required: true, message: '请选择开始日期', trigger: 'blur'}],
                time1: [{type: 'date', required: true, message: '请选择开始时间', trigger: 'blur'}],
                time2: [{type: 'date', required: true, validator: checkTime, trigger: 'change'}],
                event: [{required: true, message: '请填写事件', trigger: 'blur'}],
                validate: [{required: true, message: '请填写身份验证', trigger: 'blur'}]
            },
        }
    },
    mounted() {
        let el_width = document.getElementById("todo-clock").offsetWidth;
        let window_height = document.documentElement.clientHeight;
        this.svgWidth = Math.min(el_width, window_height * 0.85) * 0.9;
        this.refreshEventData(700);
        this.Draw();
    },
    methods: {
        resetEventForm() {
            if (this.$refs['eventForm'])
                this.$refs['eventForm'].resetFields();
        },
        dialogOpen() {
            this.resetEventForm();
        },
        getAPISource() {
            domain = document.domain;
            if (!domain)
                return 'http://localhost:3846'
            return `https://${domain}:3846`;
        },
        submitEvent() {
            this.$refs['eventForm'].validate(v => {
                if (!v) return;
                let apiSource = this.getAPISource();
                let data = getFormData(this.form);
                this.sendingEvent = true;
                axios({
                    method: 'post',
                    url: apiSource + '/add_schedule',
                    headers: {
                        "Content-Type":'application/x-www-form-urlencoded; charset=UTF-8'
                    },
                    data: data
                })
                .then(response => {
                    this.sendingEvent = false;
                    let data = response.data;
                    if (data.code != 0){
                        ElementPlus.ElMessage.error('添加失败: ' + data.message);
                    }
                    else {
                        this.addingEvent = false;
                        this.refreshEventData();
                        ElementPlus.ElMessage.success('添加成功');
                    }
                })
                .catch(error => {
                    this.sendingEvent = false;
                    ElementPlus.ElMessage.error('添加失败: 未知错误');
                });
            });
        },
        changeName() {
            this.refreshEventData();
        },
        addEvent() {
            this.addingEvent = true;
        },
        Draw() {
            nowTimezone = -(new Date().getTimezoneOffset())/60;
            animateDraw(this.svgWidth, this.themeColor[this.username], nowTimezone);
        },
        refreshEventData(delay = 0) {
            var loadingInstance = ElementPlus.ElLoading.service({text: '正在获取日程'});
            let apiSource = this.getAPISource();
            username = this.username;
            offset = this.offset; // Keep it consistent with the backend
            axios({
                method: 'get',
                url: apiSource + '/get_daily_schedule',
                params: {username: username, offset: -offset}
            })
            .then(response => {
                let data = response.data;
                if (data.code != 0){
                    ElementPlus.ElMessage.error('获取日程失败: ' + data.message);
                }
                else {
                    this.eventData = data.data;
                    let xiaowuDist, lanranDist;

                    let cirColor = this.themeColor[this.username];
                    let timezone = this.timezone[this.username];

                    this.todayText = getTodayText(timezone, offset);
                    if (offset != 0)
                        this.todayEventTitle = `${getTodayText(timezone, offset, true)}的日程`;
                    else
                        this.todayEventTitle = '今天的日程';

                    if (this.username == 'lanran') {
                        xiaowuDist = 20;
                        lanranDist = -20;
                    }
                    else {
                        lanranDist = 20;
                        xiaowuDist = -20;
                    }
                    changeCircleUser(cirColor, timezone, offset);
                    setTimeout(() => {
                        animateDrawEvents(this.eventData.xiaowu, xiaowuDist,
                            this.themeColor.xiaowu, '#events-xiaowu',
                            this.svgWidth, '小吴');
                        animateDrawEvents(this.eventData.lanran, lanranDist,
                            this.themeColor.lanran, '#events-lanran',
                            this.svgWidth, '小染');
                    }, delay);
                }
                loadingInstance.close();
            })
            .catch(error => {
                loadingInstance.close();
                ElementPlus.ElMessage.error('获取日程失败: 未知错误');
            });
        },
        showEvents() {
            this.showingEvents = true;
        },
        timeFormatterSt(row, column) {
            return timeFormatter(row.st_sec);
        },
        timeFormatterEn(row, column) {
            return timeFormatter(row.en_sec);
        },
        tableRowStatus({row, rowIndex}) {
            if (this.offset != 0) return '';
            let nowSec = getNowTimestamp(this.timezone[this.username], this.offset);
            if (nowSec > row.en_sec)
                return 'info-row';
            if (nowSec >= row.st_sec && nowSec <= row.en_sec)
                return 'success-row';
            if (nowSec < row.st_sec && nowSec >= row.st_sec - 15*60)
                return 'warning-row';
            return '';
        },
        deleteItem(id) {
            this.$confirm("确认删除该日程？<br>如果这是周期日程，将会删除<b>全部</b>而非单次日程！", "删除日程", {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'warning',
                dangerouslyUseHTMLString: true,
                showInput: true,
                inputPlaceholder: '请输入姓名拼音全拼以验证身份',
                beforeClose: this.deleteDialogClose(id),
            }).catch(() => {});
        },
        deleteDialogClose(id) {
            let apiSource = this.getAPISource();
            let successCallback = this.refreshEventData;
            return function(action, instance, done) {
                if (action != "confirm") {
                    done();
                    return;
                }
                validate = instance.inputValue;
                let params = {
                    id: id,
                    validate: validate
                };
                let data = Qs.stringify(params);

                var loadingInstance = ElementPlus.ElLoading.service({text: '请稍等'});
                axios({
                    method: 'post',
                    url: apiSource + '/remove_schedule',
                    headers: {
                        "Content-Type":'application/x-www-form-urlencoded; charset=UTF-8'
                    },
                    data: data,
                })
                .then(response => {
                    loadingInstance.close();
                    data = response.data;
                    if (data.code != 0) {
                        ElementPlus.ElMessage.error('删除失败: ' + data.message);
                    }
                    else {
                        ElementPlus.ElMessage.success('删除成功');
                        done();
                        successCallback();
                    }
                })
                .catch(error => {
                    loadingInstance.close();
                    ElementPlus.ElMessage.error('删除失败: 未知原因');
                });
            }
        },
        prevDay() {
            this.offset--;
            if (!this.backTodayTipPop) {
                ElementPlus.ElMessage('点击中间的日期按钮，可以快速回到今天哦~');
                this.backTodayTipPop = true;
            }
            this.refreshEventData();
        },
        nextDay() {
            this.offset++;
            if (!this.backTodayTipPop) {
                ElementPlus.ElMessage('点击中间的日期栏，可以快速回到今天哦~');
                this.backTodayTipPop = true;
            }
            this.refreshEventData();
        },
        backToday() {
            this.offset = 0;
            this.refreshEventData();
        }
    }
}