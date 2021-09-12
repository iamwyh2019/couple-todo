const Todo = {
    data() {
        return {
            svgWidth: 0,
            username: "lanran",
            addingEvent: false,
        }
    },
    mounted() {
        let el_width = document.getElementById("todo-clock").offsetWidth;
        let window_height = document.documentElement.clientHeight;
        this.svgWidth = Math.min(el_width, window_height) * 0.75;
        this.animateDraw();
    },
    methods: {
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