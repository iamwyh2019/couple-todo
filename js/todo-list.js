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
            xiaowuColor: 'lightpink',
            lanranColor: '#6EA8FE',
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
        this.svgWidth = Math.min(el_width, window_height) * 0.75;
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
        submitEvent() {
            this.$refs['eventForm'].validate(v => {
                if (!v) return;

                let data = getFormData(this.form);
                this.sendingEvent = true;
                axios({
                    method: 'post',
                    url: 'http://localhost:3846/add_schedule',
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
            animateDraw(this.svgWidth);
        },
        refreshEventData(delay = 0) {
            var loadingInstance = ElementPlus.ElLoading.service({text: '正在获取日程'});
            username = this.username;
            axios({
                method: 'get',
                url: 'http://localhost:3846/get_daily_schedule',
                params: {username: username}
            })
            .then(response => {
                let data = response.data;
                if (data.code != 0){
                    ElementPlus.ElMessage.error('获取日程失败: ' + data.message);
                }
                else {
                    this.eventData = data.data;
                    let xiaowuDist, lanranDist;
                    if (this.username == 'lanran') {
                        xiaowuDist = 20;
                        lanranDist = -20;
                    }
                    else {
                        lanranDist = 20;
                        xiaowuDist = -20;
                    }
                    setTimeout(() => {
                        animateDrawEvents(this.eventData.xiaowu, xiaowuDist,
                            this.xiaowuColor, '#events-xiaowu', this.svgWidth);
                        animateDrawEvents(this.eventData.lanran, lanranDist,
                            this.lanranColor, '#events-lanran', this.svgWidth);
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