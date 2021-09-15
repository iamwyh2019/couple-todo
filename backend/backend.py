from flask import Flask, request, jsonify
from gevent import pywsgi
from datasource import ScheduleDatabase
from flask_cors import CORS
import json

with open('val.json', 'r', encoding = 'utf-8') as f:
    val_json = json.load(f)
val_pwd = val_json['val']

app = Flask(__name__)
CORS(app, resources=r'/*')

@app.route('/get_daily_schedule', methods = ["GET"])
def get_daily_schedule():
    # One parameter: st --> start of one's day (UTC timestamp)
    username = request.args.get("username", type = str, default = None)
    offset = request.args.get("offset", type = int, default = 0)
    if username == None:
        return jsonify({
            "code": 2,
            "message": "Invalid username"
        })
    
    database = ScheduleDatabase()
    lanran, xiaowu = database.findTodayEvent(username, offset)
    result = {
        "code": 0,
        "message": "",
        "data": {
            "lanran": lanran,
            "xiaowu": xiaowu,
        }
    }

    return jsonify(result)

@app.route('/add_schedule', methods = ["POST"])
def add_schedule():
    form = request.form
    name, event, freq = form['name'], form['event'], form['freq']
    year = form.get('year', type = int, default = -1)
    month = form.get('month', type = int, default = -1)
    day = form.get('day', type = int, default = -1)
    st_sec = form.get('st_sec', type = int, default = -1)
    en_sec = form.get('en_sec', type = int, default = -1)
    validate = form.get('validate', type = str, default = '')

    if validate != val_pwd:
        return jsonify({
            "code": 5,
            "message": "身份验证失败"
        })

    if year == -1 or month == -1 or day == -1 or st_sec == -1 or en_sec == -1:
        return jsonify({
            "code": 4,
            "message": "Invalid parameter"
        })

    if freq not in ScheduleDatabase.STR2FREQ:
        return jsonify({
            "code": 1,
            "message": "Invalid frequency"
        })
    freq = ScheduleDatabase.STR2FREQ[freq]

    database = ScheduleDatabase()
    database.addEvent(name, event, year, month, day, st_sec, en_sec, freq)
    
    return jsonify({
        "code": 0,
        "message": ""
    })

@app.route('/remove_schedule', methods = ["POST"])
def remove_schedule():
    event_id = request.form.get("id", type = int, default = -1)
    validate = request.form.get('validate', type = str, default = '')

    if validate != val_pwd:
        return jsonify({
            "code": 5,
            "message": "身份验证失败"
        })
    if event_id == -1:
        return jsonify({
            "code": 3,
            "message": "Invalid event ID"
        })
    
    database = ScheduleDatabase()
    database.removeEvent(event_id)

    return jsonify({
        "code": 0,
        "message": ""
    })
if __name__ == "__main__":
    server = pywsgi.WSGIServer(('0.0.0.0', 3846), app,
        keyfile = 'cert/privkey.pem', certfile = 'cert/fullchain.pem')
    server.serve_forever()