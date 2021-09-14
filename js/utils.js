const DAYLEN = 24*60*60;
const radiusRatio = 0.40;
const ringWidth = 12;
const urgent = 15*60; // 15 mins

var nowCircle, alpha, svgWidth, nowTimezone;
var intervalEvent = {}
var circleMoveEvent;

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
        nowCircle.transition()
            .duration(500)
            .ease(Math.sqrt)
            .style('opacity', 1);
    }, animationTime);

    if (circleMoveEvent)
        clearInterval(circleMoveEvent);
    circleMoveEvent = setInterval(() => {
        alpha += 2*Math.PI / 360;
        adjustCirclePosition();
    }, 4*60*1000);

    function adjustCirclePosition() {
        nowCircle.attr('cx', circleX(alpha))
            .attr('cy', circleY(alpha))
    }
}

function animateDrawEvents(eventList, gap, col, gname, svgWidth, username) {
    for (let i=0; i<eventList.length; ++i) {
        eventList[i].startAngle = 2*Math.PI * eventList[i].st_sec / DAYLEN;
        eventList[i].endAngle = 2*Math.PI * eventList[i].en_sec / DAYLEN;
    }

    let arc_generator = d3.arc()
        .innerRadius(svgWidth * radiusRatio + gap)
        .outerRadius(svgWidth * radiusRatio + gap + ringWidth);
    d3.select('svg').select(gname).selectAll('path').remove();

    var groupSelect = d3.select('svg').select(gname);
    let dataEnter = groupSelect.selectAll('path')
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
        .style('opacity', 0.7);

    groupSelect.selectAll('text').remove();
    groupSelect.selectAll('text').data(findEvents(eventList, username))
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(${svgWidth/2},${svgWidth/2})`)
        .attr('y', (d,i) => (i+1)*gap)
        .text(d => d)
        .style('opacity', 0)
        .transition()
        .duration(500)
        .ease(Math.sqrt)
        .style('opacity', 1);
    
    if (intervalEvent[username])
        clearInterval(intervalEvent[username]);
    intervalEvent[username] = setInterval(() => {
        let texts = findEvents(eventList, username);
        groupSelect.selectAll('text')
            .data(texts)
            .text(d => d);
    }, 60*1000);

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
    nowTimezone = timezone;
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

function timeFormatter(sec) {
    hour = Math.floor(sec/3600);
    minutes = Math.floor((sec%3600)/60);
    padding = (minutes < 10)? '0': '';
    return hour + ':' + padding + minutes;
}

function findEvents(events, name) {
    let nowSec = getNowTimestamp(nowTimezone),
        ongoingText, nextText;

    // step 1: find an ongoing event
    let nowEvents = events.filter(d => (d.st_sec <= nowSec && d.en_sec >= nowSec));
    if (nowEvents.length > 0)
        ongoingText = `${name}正在: ${nowEvents[0].event}`;
    
    // step 2: find most recent incoming event
    let nextEvents = events.filter(d => d.st_sec > nowSec);
    if (nextEvents.length > 0) {
        let minComingIndex = 0;
        for (let i = 1; i < nextEvents.length; ++i) {
            if (nextEvents[i].st_sec < nextEvents[minComingIndex].st_sec){
                minComingIndex = i;
            }
        }
        let eventText = nextEvents[minComingIndex].event;
        if (nextEvents[minComingIndex].st_sec - nowSec <= urgent)
            nextText = `${name}很快要: ${eventText}`;
        else
            nextText = `${name}接下来: ${eventText}`;
    }

    if (ongoingText && nextText)
        return [ongoingText, nextText];
    if (ongoingText) return [ongoingText];
    if (nextText) return [nextText];
    return [`${name}今天没有日程了~`];
}