# couple-todo
This project displays daily agenda of two people in different time zones. [demo](https://iamwyh.cn/ring)

Though not built for that intention, it also works for two people in the same time zone.



## Deployment

### Deploying backend
To deploy the backend, you need to:
 1. Install Python
 2. Install Python dependencies: flask, flask_cors, gevent
 3. Move folder `backend` to an appropriate location (not externally accessible)
 4. Create a file `val.json` (encoding UTF-8) under folder `backend` with one-line content: `{"val": "<password>"}`, where `<password>` is the authentication code for adding and removing events. For example, it can be a name or a random string.
 5. Depending on the protocol you are using, follow one of the following instructions
 - If you are using https, create a folder `cert` under `backend`, then copy your ssl cert & key files (or create symbolic links) to the folder you just created, and modify the names on line 101 of `backend.py`;
 - If you are using http (usually the case when running locally), remove line 101 of `backend.py` and end line 100 with a right bracket.
 6. Run `backend.py`. Modify the port if necessary (on default 3846), and keep the frontend request port consistent. Please make sure this port is not occupied and your server provider allows external access to this port. You may have to refer to the "security group" setting.

### Deploying frontend
To deploy the frontend, you just need to copy all remaining files to an appropriate location in your wwwroot. A few things worth noting:
 - Many texts are hard-coded in the frontend, such as the two people's names, their theme colors, their time zones, some prompt texts. I've done certain level of decoupling and parameterization so it shouldn't be too hard to make your own version. I suggest you keep the internal name "lanran" & "xiaowu". Take them as user1 and user2.
 - On default, when running on local machine, all requests go via http; when running on a server, all go via https. To change this behavior or change the port, modify function `getAPISource` in `js/todo-list.js`.



## Usage

If you are running on local machine, open `index.html` with your browser. If on a remote server, visit that page.

Please be VERY cautious deleting an event. The event is **physically deleted** and there's NO rollback.



## TODO

- [ ] Add buttons "show yesterday" and "show tomorrow". We have added backend support (see the `offset` parameter) but are still discussing page layouts.
- [ ] Add a tooltip for pressing event curves. The main difficulty is the interactions between Vue, element-plus, and d3;
- [ ] Add an "edit" button on event table. (Is there a need for that?)



## Open-source
This project is open-sourced under Apache License 2.0, which means:

- You are free to use, modify, and re-distribute any part of this project, for non-commercial and commercial use, and you can stay close-sourced.
- You have to place this license and the copyright notice in your work, and state your changes to the original code.
- We give NO guarantee to, and is NOT for, any part of this project, or any result incurred from it. And more broadly, you may NOT use this project to do anything against us.



## Credit

This project uses [Vue.js](https://v3.vuejs.org/), [element-plus](https://element-plus.org), [axios.js](https://axios-http.com/), [Qs.js](https://github.com/ljharb/qs), [d3.js](https://d3js.org/). We want to thank the developers for their excellent work.
