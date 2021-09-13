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
            form: {
                date: '',
                time1: '',
                time2: '',
                name: 'lanran',
                freq: 'once',
            },
            rules: {
                date: [{required: true, message: '请选择开始日期', trigger: 'blur'}],
                time1: [{type: 'date', required: true, message: '请选择开始时间', trigger: 'blur'}],
                time2: [{type: 'date', required: true, validator: checkTime, trigger: 'change'}],
                event: [{required: true, message: '请填写事件', trigger: 'blur'}],
            },
        }
    },
    mounted() {
        let el_width = document.getElementById("todo-clock").offsetWidth;
        let window_height = document.documentElement.clientHeight;
        this.svgWidth = Math.min(el_width, window_height) * 0.75;
        this.Draw();
    },
    methods: {
        resetEventForm() {
            this.$refs['eventForm'].resetFields();
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
                            ElementPlus.ElMessage.error(data.message);
                        }
                        else {
                            ElementPlus.ElMessage.success('添加成功');
                        }
                        this.addingEvent = false;
                    })
                    .catch(error => {
                        this.sendingEvent = false;
                        ElementPlus.ElMessage.error(error);
                    });
            });
        },
        changeName() {
            
        },
        addEvent() {
            this.addingEvent = true;
        },
        Draw() {
            animateDraw(this.svgWidth);
        }
    }
}