import sqlite3
from datetime import datetime, timedelta

class ScheduleDatabase():

    FREQ_ONCE = 0
    FREQ_DAILY = 1
    FREQ_WEEKLY = 2

    STR2FREQ = {
        "once": FREQ_ONCE,
        "daily": FREQ_DAILY,
        "weekly": FREQ_WEEKLY
    }

    def __init__(self, dbpath = './schedule.db'):
        self._dbpath = dbpath
        self.columns = "name,event,year,month,day,st_sec,en_sec,freq"
        self.query = "(?,?,?,?,?,?,?,?)"

        with self._connect() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS schedule(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                event TEXT NOT NULL,
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                day INTEGER NOT NULL,
                st_sec INTEGER NOT NULL,
                en_sec INTEGER NOT NULL,
                freq INTEGER NOT NULL
            )''')

    def _connect(self):
        return sqlite3.connect(self._dbpath)
    
    def addEvent(self, name, event, year, month, day, st_sec, en_sec, freq):
        data = (name, event, year, month, day, st_sec, en_sec, freq)
        with self._connect() as conn:
            conn.execute("INSERT INTO schedule ({}) values {}".format(self.columns, self.query), data)
        
    def removeEvent(self, event_id):
        with self._connect() as conn:
            conn.execute("DELETE FROM schedule WHERE id=?", (event_id,))
    
    def findTodayEvent(self, username, offset):
        # return format: ([lanran's tasks], [xiaowu's tasks])
        lanran = []
        xiaowu = []
        DAYLEN = 24*60*60

        with self._connect() as conn:
            lanran_list = conn.execute("SELECT FROM schedule WHERE name=?", ('lanran',)).fetchall()
            xiaowu_list = conn.execute("SELECT FROM schedule WHERE name=?", ('xiaowu',)).fetchall()
        
        def process_self(mylist, myres, today):
            for row in mylist:
                rdict = self.row2dict(row)
                eventDate = datetime(rdict['year'], rdict['month'], rdict['day'])
                if eventDate > today:
                    continue
                
                if rdict['freq'] == self.FREQ_ONCE:
                    # Is today, append
                    if eventDate == today:
                        myres.append(rdict)
                elif rdict['freq'] == self.FREQ_DAILY:
                    # Definitely append
                    myres.append(rdict)
                elif rdict['freq'] == self.FREQ_DAILY:
                    if eventDate.isoweekday() == nweek:
                        myres.append(rdict)
        
        def process_other(olist, ores, timediff, today):
            for row in olist:
                rdict = self.row2dict(row)
                shiftStart = datetime(rdict['year'],rdict['month'],rdict['day'])\
                            +timedelta(seconds=rdict['st_sec'])-timedelta(hours=timediff)
                shiftEnd = datetime(rdict['year'],rdict['month'],rdict['day'])\
                            +timedelta(seconds=rdict['en_sec'])-timedelta(hours=timediff)
                startDate = datetime(shiftStart.year, shiftStart.month, shiftStart.day)
                endDate = datetime(shiftEnd.year, shiftEnd.month, shiftEnd.day)
                if startDate > today:
                    continue

                if rdict['freq'] == self.FREQ_ONCE:
                    if startDate == today or endDate == today:
                        rdict['st_sec'] = max(0, int((shiftStart-today).total_seconds()))
                        rdict['en_sec'] = min(DAYLEN, int((shiftEnd-today).total_seconds()))
                        ores.append(rdict)
                elif rdict['freq'] == self.FREQ_DAILY:
                    # If start & end cross 0:00, add two events
                    # else, just one
                    if startDate == endDate:
                        rdict['st_sec'] = int((shiftStart-startDate).total_seconds())
                        rdict['en_sec'] = int((shiftEnd-endDate).total_seconds())
                        ores.append(rdict)
                    else:
                        ndict = rdict.copy()
                        rdict['st_sec'] = 0
                        rdict['en_sec'] = int((shiftEnd-endDate).total_seconds())
                        ores.append(rdict)
                        ndict['st_sec'] = int((shiftStart-startDate).total_seconds())
                        ndict['en_sec'] = DAYLEN
                        ores.append(ndict)
                elif rdict['freq'] == self.FREQ_WEEKLY:
                    # It's impossible there's two events
                    if startDate.isoweekday() == nweek:
                        rdict['st_sec'] = int((shiftStart-startDate).total_seconds())
                        if endDate.isoweekday() == nweek:
                            rdict['en_sec'] = int((shiftEnd-endDate).total_seconds())
                        else:
                            rdict['en_sec'] = DAYLEN
                        ores.append(rdict)
                    elif endDate.isoweekday() == nweek:
                        rdict['en_sec'] = int((shiftEnd-endDate).total_seconds())
                        if startDate.isoweekday() == nweek:
                            rdict['st_sec'] = int((shiftStart-startDate).total_seconds())
                        else:
                            rdict['st_sec'] = 0
                        ores.append(rdict)

        if username == 'lanran':
            timediff = 13 if self.serverIsDST() else 14
            now = datetime.now() - timedelta(days = offset, hours = timediff)
            nyear, nmonth, nday, nweek = now.year, now.month, now.day, now.isoweekday()
            today = datetime(nyear, nmonth, nday)

            process_self(lanran_list, lanran, today)
            process_other(xiaowu_list, xiaowu, timediff, today)
        
        elif username == 'xiaowu':
            timediff = -13 if self.serverIsDST() else -14
            now = datetime.now() - timedelta(days = offset)
            nyear, nmonth, nday, nweek = now.year, now.month, now.day, now.isoweekday()
            today = datetime(nyear, nmonth, nday)

            process_self(xiaowu_list, xiaowu, today)
            process_other(lanran_list, lanran, timediff, today)
        
        return lanran, xiaowu
    

    @staticmethod
    def row2dict(r):
        return {
            "id": r[0],
            "name": r[1],
            "event": r[2],
            "year": r[3],
            "month": r[4],
            "day": r[5],
            "st_sec": r[6],
            "en_sec": r[7],
            "freq": r[8]
        }
    
    @staticmethod
    def isDST(year, month, day):
        # Ignore the two hours. When clock hits Nov.7, assume it's no longer DST
        shiftDay = datetime(2021,11,7)
        nowTime = datetime(year, month, day)
        return nowTime < shiftDay
    
    @staticmethod
    def serverIsDST():
        # Server is always at Beijing time
        # Keep the logic consistent: when time passes 13:00, assume it's no longer DST
        shiftDay = datetime(2021,11,7,13)
        nowTime = datetime.now()
        return nowTime < shiftDay
