(async () => {
  const { waitForControlBar } = await import('../live-control-bar')

  let changeEventHook = false
  let danmakuSendBarElement: Element
  const danmakuSendBarClass = 'danmaku-send-bar'
  waitForControlBar({
    init: () => {
      resources.applyStyle('danmakuSendBarStyle')
    },
    callback: async controlBar => {
      const leftController = dq(controlBar, '.left-area') as HTMLDivElement
      const originalTextArea = await SpinQuery.select('.control-panel-ctnr .chat-input-ctnr .chat-input') as HTMLTextAreaElement
      const sendButton = await SpinQuery.select('.control-panel-ctnr .chat-input-ctnr ~ .bottom-actions .bl-button--primary') as HTMLButtonElement

      if ([leftController, originalTextArea, sendButton].some(it => it === null)) {
        console.warn('[danmakuSendBar] ref elements not found', leftController === null, originalTextArea === null, sendButton === null)
        return
      }
      if (dq(controlBar, `.${danmakuSendBarClass}`)) {
        return
      }
      if (!danmakuSendBarElement) {
        const DanmakuSendBar = Vue.extend({
          template: /*html*/`
          <div class="${danmakuSendBarClass}">
            <input
              type="text"
              placeholder="发个弹幕呗~"
              :value="value"
              @keydown.enter="send()"
              @input="updateValue($event.target.value)"
              maxlength="30"
            />
          </div>
        `,
          data() {
            return {
              value: originalTextArea.value
            }
          },
          mounted() {
            originalTextArea.addEventListener('input', this.listenChange)
            originalTextArea.addEventListener('change', this.listenChange)
            if (!changeEventHook) {
              const original = Object.getOwnPropertyDescriptors(HTMLTextAreaElement.prototype).value
              Object.defineProperty(originalTextArea, 'value', {
                ...original,
                set(value: string) {
                  original.set!.call(this, value)
                  raiseEvent(originalTextArea, 'input')
                }
              })
              changeEventHook = true
            }
          },
          beforeDestroy() {
            originalTextArea.removeEventListener('input', this.listenChange)
            originalTextArea.removeEventListener('change', this.listenChange)
          },
          methods: {
            updateValue(newValue: string) {
              originalTextArea.value = newValue
              raiseEvent(originalTextArea, 'input')
            },
            send() {
              if (!sendButton.disabled) {
                this.value = ''
                sendButton.click()
              }
            },
            listenChange(e: InputEvent) {
              this.value = (e.target as HTMLTextAreaElement).value
            }
          }
        })
        danmakuSendBarElement = new DanmakuSendBar().$mount().$el
      }
      leftController.insertAdjacentElement('afterend', danmakuSendBarElement)
    },
  })
})()

export default {
  reload: () => document.body.classList.remove('danmaku-send-bar-unloaded'),
  unload: () => document.body.classList.add('danmaku-send-bar-unloaded'),
}
