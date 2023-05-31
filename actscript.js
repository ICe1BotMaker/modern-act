const Act = {
    states: [],

    eleContent(state) {
        document.querySelectorAll(`ma`).forEach(tag => {
            if (tag.dataset.key === state.key) {
                tag.innerHTML = tag.innerHTML.replace(tag.innerHTML, state.state);
            }
        });

        if (/\$\{(.+?)\}/.test(document.body.innerHTML)) {
            const matches = document.body.innerHTML.match(/\$\{(.+?)\}/g);

            matches.forEach(match => {
                if (/\$\{(.+?)\}/.exec(match)[1] === state.key) {
                    document.body.innerHTML = document.body.innerHTML.replace(match, `<ma data-key="${state.key}">${state.value}</ma>`);
                }
            });
        }
    },

    actState({key, value}) {
        this.states = [...this.states, {
            key: key,
            state: value
        }];

        this.eleContent({key, value});
    },

    modState({key, value}) {
        this.states.forEach((state, idx) => {
            if (state.key === key) {
                this.states[idx].state = value;
                this.eleContent(state);
            }
        });

    },

    get({key}) {
        let result;

        this.states.forEach(state => {
            if (state.key === key) {
                result = state.state;
            }
        });

        return result;
    }
};