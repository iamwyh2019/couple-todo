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
            eventData: null,
            themeColor: {
                lanran: '#6EA8FE',
                xiaowu: 'lightpink'
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
            animateDraw(this.svgWidth, this.themeColor[this.username]);
        },
        refreshEventData(delay = 0) {
            var loadingInstance = ElementPlus.ElLoading.service({text: '正在获取日程'});
            let apiSource = this.getAPISource();
            username = this.username;
            axios({
                method: 'get',
                url: apiSource + '/get_daily_schedule',
                params: {username: username}
            })
            .then(response => {
                let data = response.data;
                if (data.code != 0){
                    ElementPlus.ElMessage.error('获取日程失败: ' + data.message);
                }
                else {
                    this.eventData = data.data;
                    let xiaowuDist, lanranDist, cirColor;
                    if (this.username == 'lanran') {
                        xiaowuDist = 20;
                        lanranDist = -20;
                        cirColor = this.themeColor.lanran;
                    }
                    else {
                        lanranDist = 20;
                        xiaowuDist = -20;
                        cirColor = this.themeColor.xiaowu;
                    }
                    changeCircleColor(cirColor);
                    setTimeout(() => {
                        animateDrawEvents(this.eventData.xiaowu, xiaowuDist,
                            this.themeColor.xiaowu, '#events-xiaowu', this.svgWidth);
                        animateDrawEvents(this.eventData.lanran, lanranDist,
                            this.themeColor.lanran, '#events-lanran', this.svgWidth);
                    }, delay);
                }
                loadingInstance.close();
            })
            .catch(error => {
                loadingInstance.close();
                ElementPlus.ElMessage.error('获取日程失败: 未知错误');
            });
        }
    }
}