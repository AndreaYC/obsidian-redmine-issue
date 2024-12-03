import { ButtonComponent, Modal, Setting } from 'obsidian'
import { RedmineIssue, RedmineTimeEntryActivity } from './lib/redmine'
import RedmineIssuePlugin from './main'
import { OnTimerSaveEvent } from './types'

export default class TrackingSaveModal extends Modal {
  plugin: RedmineIssuePlugin
  event: OnTimerSaveEvent;

	constructor(plugin: RedmineIssuePlugin, event: OnTimerSaveEvent) {
		super(plugin.app)
    this.plugin = plugin
    this.event = event
	}

  async onOpen(): Promise<void> {
    this.contentEl.empty()
    this.contentEl.createSpan({
      text: 'Loading..',
      cls: ['redmine-modal-loading']
    })

    let issue: RedmineIssue
    let activityTypes: RedmineTimeEntryActivity[]
    try {
      issue = await this.plugin.redmineClient.getIssueDetails(this.event.detail.id)
      activityTypes = await this.plugin.redmineClient.getAllActivities()
    } catch (error) {
      this.contentEl.empty()
      this.contentEl.createEl('h2', {
        text: error.toString()
      }).addClass('in-error')
      return  
    }
    
    this.contentEl.empty()
    this.contentEl.createEl('h2', {
      text: `${issue.id} ${issue.subject}`,
      cls: ['redmine-modal-title']
    })

    let duration = (this.event.detail.duration / 60 / 60).toFixed(2)
    let activityTypeId = activityTypes[0].id
    let spendOn = this.event.detail.startedAt

    new Setting(this.contentEl)
    .setName('Date')
    .setDesc('Select the date for the activity')
      .addText(text => {
        // 使用 input 元素的 date 類型
        const input = document.createElement('input')
        input.type = 'date'
        input.value = new Date().toISOString().slice(0, 10)
        input.onchange = async () => {
            spendOn = new Date(input.value) // 更新 spendOn
            console.log('Selected date:', spendOn)
        }

        // 將 date 選單嵌入到 Obsidian 的設定框架中
        text.inputEl.replaceWith(input)
    })

    new Setting(this.contentEl)
      .setName('Hours')
      .addText(text => text
        .setValue(duration)
        .onChange(async (value) => {
          duration = value
        }))

    let comment = ''

    new Setting(this.contentEl)
      .setName('Comment')
      .addText(text => text
        .setValue(comment)
        .onChange(async (value) => {
          comment = value
        }))

    new Setting(this.contentEl)
      .setName('Activity')
      .addDropdown(dropdown => dropdown
        .addOptions(activityTypes.reduce((previous: Record<string, string>, activity) => {
          previous[activity.id] = activity.name
          return previous
        }, {}))
        .setValue(activityTypeId)
        .onChange(async (value) => {
          activityTypeId = value
        }))

    const commandContainer = this.contentEl.createDiv({ cls: ['redmine-modal-commands'] })

    const btnSave = new ButtonComponent(commandContainer)
      .setButtonText('save')
      .onClick(() => {
        if (parseFloat(duration) <= 0) {
          return
        }

        btnSave.setDisabled(true)
        this.save(duration, parseFloat(activityTypeId), spendOn, comment).finally(() => {
          btnSave.setDisabled(false)
        }).then(() => {
          this.close()
        }).catch(error => {
          console.error(error)
        })
      })
  }

  async save(duration: string, activityId: number, spendOn:Date, comment: string): Promise<void> {
    await this.plugin.redmineClient.saveIssueTimeEntry(this.event.detail.id, parseFloat(duration), activityId, spendOn, comment)
    this.plugin.onTimerSaved(this.event)
  }
}
