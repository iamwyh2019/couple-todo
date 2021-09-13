function getUTCToday() {
    let d1 = new Date();
    let d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    return Math.floor(d2.getTime() / 1000);
}