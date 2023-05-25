const Act = {
    states: [],

    eleContent(state) {
        const elements = document.querySelectorAll(`body *`);

        elements.forEach(element => {
            if (/\$\{(.+?)\}/g.test(element.textContent)) {
                let match = element.textContent.match(/\$\{(.+?)\}/g);
                
                if (/\$\{(.+?)\}/.exec(match)[1] === state.key) {
                    element.dataset.marep = `__ma-rep`;
                    element.textContent = element.textContent.replace(match, `\u200d${state.value}\u200d`);
                }
            } else if (element.dataset.marep === `__ma-rep`) {
                element.textContent = element.textContent.replace(/\u200d(.+?)\u200d/, `\u200d${state.state}\u200d`);
            }
        });
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