class WakeLock {
    constructor() {
        this.lock = new UnlockedWakeLock();
    }

    async aquire() {
        if (this.supported()) {
            this.lock = await navigator.wakeLock.request("screen");
        }
    }

    async release() {
        await this.lock.release();
        this.lock = new UnlockedWakeLock();
    }

    supported() {
        return "wakeLock" in navigator;
    }
}

class UnlockedWakeLock {
    async release() {}
}

export default WakeLock;