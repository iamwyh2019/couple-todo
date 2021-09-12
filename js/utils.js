function getUTCToday() {
    let d1 = new Date();
    let d2 = new Date(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate());
    return Math.floor(d2.getTime() / 1000);
}