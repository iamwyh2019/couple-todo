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
        this.animateDraw();
    },
    methods: {
        resetEventForm() {
            this.$refs['eventForm'].resetFields();
        },
        submitEvent() {
            this.$refs['eventForm'].validate(v => {
                if (!v) return;

                function getTime(ts) {
                    let t = new Date(ts);
                    return t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds();
                }

                let dt = new Date(this.form.date);
                let params = {
                    'name': this.form.name,
                    'event': this.form.event,
                    'year': dt.getFullYear(),
                    'month': dt.getMonth() + 1,
                    'day': dt.getDate(),
                    'st_sec': getTime(this.form.time1),
                    'en_sec': getTime(this.form.time2),
                    'freq': this.form.freq
                };
                let data = Qs.stringify(params);

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
                        console.log(data);
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
        animateDraw() {
            var svgWidth = this.svgWidth;
            let animationTime = 700;
            let arc_generator = d3.arc()
                .innerRadius(svgWidth * 0.40)
                .outerRadius(svgWidth * 0.40 + 10);
            let angle_data = d3.pie()([1]);
            angle_data.forEach(d => {
                d._dest = {
                    startAngle: d.startAngle,
                    endAngle: d.endAngle
                };
                d.endAngle = d.startAngle;
            });
            d3.select('svg').select('#clock').selectAll('path')
                .data(angle_data)
                .enter()
                .append('path')
                .style('fill', 'lightgray')
                .attr('transform', `translate(${this.svgWidth/2},${this.svgWidth/2})`)
                .attr("d", arc_generator)
                .transition()
                .duration(animationTime)
                .ease(t => (1/(1+Math.exp(-10.5*t+5))-0.00669285)/0.98923701)
                .attrTween("d", function(d) {
                    var interpolate = d3.interpolate(d, d._dest);
                    return function(t){
                        return arc_generator(interpolate(t));
                    }
                });
            
            var nowCircle = d3.select('svg').select('#clock')
                .append('circle')
                .attr('r', 7)
                .attr('fill', '#409EFF')
                .style('opacity', 0);

            adjustCirclePosition();
            setTimeout(() => {
                nowCircle
                    .transition()
                    .duration(500)
                    .style('opacity', 1);
            }, animationTime);
            setInterval(() => {
                adjustCirclePosition();
            }, 4*60*1000);

            function adjustCirclePosition() {
                let arc_center_r = svgWidth * 0.40 + 5;
                let nowTime = Math.floor((new Date().getTime())/1000),
                    utctoday = getUTCToday();
                let alpha = 2 * Math.PI * ((nowTime-utctoday)/(24*60*60));
                let cx = svgWidth / 2 + arc_center_r * Math.sin(alpha);
                let cy = svgWidth / 2 - arc_center_r * Math.cos(alpha);
                nowCircle.attr('cx', cx)
                    .attr('cy', cy)
            }
        }
    }
}