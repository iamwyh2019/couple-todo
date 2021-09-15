# couple-todo
This project displays daily agenda of two people in different timezones. [demo](https://iamwyh.cn/ring)

Though not developed for that intention, it also works for two people in the same timezone.

## Deployment

### Deploying backend
To deploy the backend, you need to:
 1. Install Python
 2. Install Python dependencies: flask, flask_cors, gevent
 3. Move the folder `backend` to an appropriate location (not externally accessible)
 4. Create a file `val.json` (encoding UTF-8) under folder `backend`, with one-line content: `{"val": "<password>"}`, where the `<password>` is the authentication for adding and removing events. For example, it can be a name or a random string.
 5. Depending on the protocol you are using, follow one of the following instructions
 - If you are using https, create a folder `cert` under `backend`, then copy your ssl cert & key files (or create symbolic links) to the folder you just created, and modify the names on line 101 of `backend.py`;
 - If you are using http (usually the case for running locally), remove line 101 of `backend.py` and end line 100 with a right bracket.
 6. Run `backend.py`. Modify the port if necessary (on default 3846), and **keep the frontend request port consistent**.

### Deploying frontend
To deploy the frontend, you just need to copy all remaining files to an appropriate location. A few things worth noting:
 - Many texts are hard-coded in the frontend, such as the two people's names, their theme colors, their timezones, some prompt texts, and so on. I've done certain level of decoupling and parameterization so it shouldn't be too hard to make your own version. I suggest you keep the internal name "lanran" & "xiaowu". Take them as user1 and user2.
 - On default, when running on local machine, all requests go via http; when running on a server, all go via https. To change this behavior or the port, modify function `getAPISource` in `js/todo-list.js`.

## Using
If you are running on local machine, open `index.html` with your browser. If on a remote server, visit that page on your browser.

Please be VERY cautious deleting an event. The event is **physicaly deleted** and there's NO rollback.

## Open-source
This project can only be used for non-commercial purposes. You don't need to inform me when you use it, but you have to specify the source.

## Credit
This project is made possible by Vue.js, element-plus, axios.js, Qs.js, d3.js. We want to thank the developers for their excellent work.
