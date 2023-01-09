module.exports = class ProgressBar {
    /**
     * 
     * @param {{
     *  progress_barchar: string
     *  empty_barchar: string
     *  format: string
     *  max: number
     *  current: number
     * }} options 
     */
    constructor (options) {
        this.progress_barchar   = options?.progress_barchar;
        this.empty_barchar      = options?.empty_barchar;

        this.max        = options?.max;
        this.current    = options?.current;

        this.format     = options?.format;
    }



    formatter (options) {
        const max       = this.max;
        const value     = this.padding(this.current, this.max.toString().length);
        const percent   = this.padding(this.percent().toFixed(2), 6);
        const bar       = this.gen_bar();

        const raw_format = typeof this.format === "function" ?
            this.format()
            :
            this.format;


        const formatted = raw_format
            .replace("{value}", value)
            .replace("{total}", max)
            .replace("{percentage}", percent)
            .replace("{bar}", bar);


        if (options?.no_log) return formatted;
        console.log(formatted);
    }

    increment (options) {
        this.current++;

        this.formatter(options);
    }

    set (value, options) {
        this.current = value;

        this.formatter(options);
    }

    gen_bar () {
        let progress = "";

        for (let i = 0 ; i < 101 ; i+=10) {
            if (this.percent() >= i) {
                progress += this.progress_barchar;
                progress += this.progress_barchar;
            } else {
                progress += this.empty_barchar;
                progress += this.empty_barchar;
            }
        }

        return progress;
    }

    percent () {
        return (this.current / this.max) * 100;
    }

    padding (string, topad) {
        if (typeof string !== "string") string = string.toString();

        let new_string = "";

        for (let i = 0 ; i < (topad - string.length) ; i++) {
            new_string += " ";
        }

        new_string = `${new_string}${string}`;

        return new_string
    }
}