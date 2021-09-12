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
    },
    methods: {
        changeName() {
            
        },
        addEvent() {
            
        }
    }
}