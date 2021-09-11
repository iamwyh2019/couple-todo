from flask import Flask, request, jsonify
from gevent import pywsgi
from datetime import datetime
import time
from datasource import ScheduleDatabase

app = Flask(__name__)

@app.route('/get_daily_schedule', methods = ["GET"])
def get_daily_schedule():
    # One parameter: st --> start of one's day (UTC timestamp)
    ts = request.args.get("ts", type = int, default = -1)
    if ts == -1:
        return jsonify({
            "code": 2,
            "msg": "Invalid timestamp"
        })
    
    database = ScheduleDatabase()
    events = database.findTodayEvent(ts)
    result = {
        "code": 0,
        "msg": "",
        "data": events
    }

    return jsonify(result)

@app.route('/add_schedule', methods = ["POST"])
def add_schedule():
    form = request.form
    name, event, freq = form['name'], form['event'], form['freq']
    st = form.get('st', type = int)
    en = form.get('en', type = int)

    if freq not in ScheduleDatabase.STR2FREQ:
        return jsonify({
            "code": 1,
            "msg": "Invalid frequency"
        })
    freq = ScheduleDatabase.STR2FREQ[freq]

    database = ScheduleDatabase()
    database.addEvent(name, event, st, en, freq)
    
    return jsonify({
        "code": 0,
        "msg": ""
    })

@app.route('/remove_schedule', methods = ["POST"])
def remove_schedule():
    event_id = request.form.get("id", type = int, default = -1)
    if event_id == -1:
        return jsonify({
            "code": 3,
            "msg": "Invalid event ID"
        })
    
    database = ScheduleDatabase()
    database.removeEvent(event_id)

    return jsonify({
        "code": 0,
        "msg": ""
    })


if __name__ == "__main__":
    server = pywsgi.WSGIServer(('0.0.0.0', 3846), app)
    server.serve_forever()