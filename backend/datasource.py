import sqlite3

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
        self.columns = "name,event,st,en,freq"
        self.query = "(?,?,?,?,?)"

        with self._connect() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS schedule(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                event TEXT NOT NULL,
                st INTEGER NOT NULL,
                en INTEGER NOT NULL,
                freq INTEGER NOT NULL
            )''')

    def _connect(self):
        return sqlite3.connect(self._dbpath)
    
    def addEvent(self, name, event, st, en, freq = FREQ_ONCE):
        data = (name, event, st, en ,freq)
        with self._connect() as conn:
            conn.execute("INSERT INTO schedule ({}) values {}".format(self.columns, self.query), data)
        
    def removeEvent(self, event_id):
        with self._connect() as conn:
            conn.execute("DELETE FROM schedule WHERE id=?", (event_id,))
    
    def findTodayEvent(self, today_ts):
        DAYLEN = 24*60*60
        WEEKLEN = 7*24*60*60
        today_end_ts = today_ts + DAYLEN

        with self._connect() as conn:
            event_list = conn.execute("SELECT * FROM schedule").fetchall()
        
        result = []

        Event = lambda id,name,event,st,en,freq: {
            "id": id,
            "name": name,
            "event": event,
            "st": max(st, today_ts),
            "en": min(en, today_end_ts),
            "freq": freq
        }

        Good = lambda st,en: (today_ts <= st < today_end_ts) or (today_ts < en <= today_end_ts)
        
        for row in event_list:
            id, name, event, st, en, freq = row

            if st > today_end_ts: # haven't begun yet
                continue

            # Case 1: Once event
            if freq == self.FREQ_ONCE:
                if Good(st,en):
                    result.append(Event(id,name,event,st,en,freq))
            
            # Case 2: Daily event
            # Shift st,en till en>=today
            # Special case: if it cross 0:00, there are two events
            elif freq == self.FREQ_DAILY:
                while en < today_ts:
                    st += DAYLEN
                    en += DAYLEN
                # Case 2.1: It doesn't cross 0:00
                if st >= today_ts:
                    # Definitely good, no need to verify
                    result.append(Event(id,name,event,st,en,freq))
                # Case 2.2: It crosses 0:00, we need to add two events
                else:
                    result.append(Event(id,name,event,st,en,freq))
                    st += DAYLEN
                    en += DAYLEN
                    result.append(Event(id,name,event,st,en,freq))
            
            # Case 3: Weekly event
            # Shift st,en till en >= today
            # Verify if it's in today
            elif freq == self.FREQ_WEEKLY:
                while en < today_ts:
                    st += WEEKLEN
                    en += WEEKLEN
                if Good(st,en):
                    result.append(Event(id,name,event,st,en,freq))
        
        return result
