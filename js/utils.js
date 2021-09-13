const DAYLEN = 24*60*60;
const radiusRatio = 0.40;
const ringWidth = 12;

var nowCircle, alpha, svgWidth;

function circleX(alpha) {
    let arc_center_r = svgWidth * radiusRatio + ringWidth / 2;
    return svgWidth / 2 + arc_center_r * Math.sin(alpha);
}

function circleY(alpha) {
    let arc_center_r = svgWidth * radiusRatio + ringWidth / 2;
    return svgWidth / 2 - arc_center_r * Math.cos(alpha);
}

function getNowTimestamp(timezone) {
    let now = new Date();
    let utcnow = now.getTime();
    tznow = new Date(utcnow + timezone*60*60*1000);
    return tznow.getUTCHours()*60*60 + tznow.getUTCMinutes()*60 + tznow.getUTCSeconds();
}

function getFormData(form) {
    function getTime(ts) {
        let t = new Date(ts);
        return t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds();
    }

    let dt = new Date(form.date);
    let params = {
        'name': form.name,
        'event': form.event,
        'year': dt.getFullYear(),
        'month': dt.getMonth() + 1,
        'day': dt.getDate(),
        'st_sec': getTime(form.time1),
        'en_sec': getTime(form.time2),
        'freq': form.freq,
        'validate': form.validate
    };
    let data = Qs.stringify(params);
    return data;
}

function animateDraw(sWidth, cirColor, timezone) {
    svgWidth = sWidth;
    let animationTime = 700;
    let arc_generator = d3.arc()
        .innerRadius(svgWidth * radiusRatio)
        .outerRadius(svgWidth * radiusRatio + ringWidth);
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
        .attr('transform', `translate(${svgWidth/2},${svgWidth/2})`)
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
    
    nowCircle = d3.select('svg').select('#clock')
        .append('circle')
        .attr('r', Math.ceil(ringWidth*3/4))
        .attr('fill', cirColor)
        .style('opacity', 0);
    
    alpha = 2*Math.PI * getNowTimestamp(timezone)/DAYLEN;

    adjustCirclePosition();
    setTimeout(() => {
        nowCircle
            .transition()
            .duration(500)
            .ease(Math.sqrt)
            .style('opacity', 1);
    }, animationTime);
    setInterval(() => {
        alpha += 1;
        adjustCirclePosition();
    }, 4*60*1000);

    function adjustCirclePosition() {
        nowCircle.attr('cx', circleX(alpha))
            .attr('cy', circleY(alpha))
    }
}

function animateDrawEvents(eventList, gap, col, gname, svgWidth) {
    for (let i=0; i<eventList.length; ++i) {
        eventList[i].startAngle = 2*Math.PI * eventList[i].st_sec / DAYLEN;
        eventList[i].endAngle = 2*Math.PI * eventList[i].en_sec / DAYLEN;
    }

    let arc_generator = d3.arc()
        .innerRadius(svgWidth * radiusRatio + gap)
        .outerRadius(svgWidth * radiusRatio + gap + ringWidth);
    d3.select('svg').select(gname).selectAll('path').remove();
    let dataEnter = d3.select('svg').select(gname).selectAll('path')
        .data(eventList)
        .enter();
    let pathEnter = dataEnter.append('path')
        .attr("d", arc_generator)
        .style('fill', col)
        .attr('transform', `translate(${svgWidth/2},${svgWidth/2})`)
        .style('opacity', 0);
    pathEnter.append('title')
        .text(d => d.event);
    pathEnter.transition()
        .duration(500)
        .ease(Math.sqrt)
        .style('opacity', 1);

    textx = (d) => {
        cangle = (d.startAngle + d.endAngle) / 2;
        return (svgWidth*radiusRatio + gap*2) * Math.sin(cangle);
    }
    texty = (d) => {
        cangle = (d.startAngle + d.endAngle) / 2;
        return -(svgWidth*radiusRatio + gap*2) * Math.cos(cangle);
    }

    /*
    d3.select('svg').select(gname).selectAll('text').remove();
    dataEnter.append('text')
        .attr('transform', `translate(${svgWidth/2},${svgWidth/2})`)
        .attr('x', textx)
        .attr('y', texty)
        .attr('text-anchor', 'middle')
        .text(d => d.event);
    */
}

function changeCircleUser(cirColor, timezone) {
    let newAlpha = Math.PI*2 * (getNowTimestamp(timezone)/DAYLEN);
    var interpolate = d3.interpolate(alpha, newAlpha);
    nowCircle.transition()
        .duration(500)
        .ease(t => (1/(1+Math.exp(-10.5*t+5))-0.00669285)/0.98923701)
        .attrTween("cx", function(d) {
            return function(t){
                return circleX(interpolate(t));
            }
        })
        .attrTween("cy", function(d) {
            return function(t){
                return circleY(interpolate(t));
            }
        })
        .style('fill', cirColor);
    alpha = newAlpha;
}