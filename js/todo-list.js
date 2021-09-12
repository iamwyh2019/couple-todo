const Todo = {
    data() {
        return {
            svgWidth: 0,
            username: "lanran",
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
            
        },
        animateDraw() {
            let arc_generator = d3.arc()
                .innerRadius(this.svgWidth * 0.40)
                .outerRadius(this.svgWidth * 0.42);
            let angle_data = d3.pie()([1]);
            angle_data.forEach(d => {
                d._dest = {
                    startAngle: d.startAngle,
                    endAngle: d.endAngle
                };
                d.endAngle = d.startAngle;
            });
            d3.select('svg').selectAll('path')
                .data(angle_data)
                .enter()
                .append('path')
                .style('fill', 'gray')
                .attr('transform', `translate(${this.svgWidth/2},${this.svgWidth/2})`)
                .attr("d", arc_generator)
                .transition()
                .duration(700)
                .ease(t => (1/(1+Math.exp(-10.5*t+5))-0.00669285)/0.98923701)
                .attrTween("d", function(d) {
                    var interpolate = d3.interpolate(d, d._dest);
                    return function(t){
                        return arc_generator(interpolate(t));
                    }
                });
        }
    }
}