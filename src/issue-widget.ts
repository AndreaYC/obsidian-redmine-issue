import RedmineIssuePlugin from './main'
import {RedmineIssue} from './lib/redmine'
import * as path from 'path'

import { Notice } from 'obsidian'
import { ButtonComponent } from 'obsidian'

export default class IssueWidget {
  el: HTMLElement;
  plugin: RedmineIssuePlugin;
  redmineIssueKey: string;
  issue: RedmineIssue;
  timerControlContainer: HTMLDivElement;
  transitionControlContainer: HTMLDivElement;

  constructor(plugin: RedmineIssuePlugin, el: HTMLElement) {
    this.plugin = plugin
    this.el = el
    this.el.addEventListener('refresh', this.loadIssue.bind(this))
    this.el.addClass('loading')
  }

  getIssueIdentifier(): string {
    return this.redmineIssueKey
  }

  setIssueIdentifier(redmineIssueKey: string): IssueWidget {
    this.el.empty()
    this.el.innerHTML = 'loading..'

    this.redmineIssueKey = redmineIssueKey
    this.loadIssue()

    return this
  }

  async loadIssue(): Promise<void> {
    try {
      this.issue = await this.plugin.redmineClient.getIssueDetails(this.redmineIssueKey)
    } catch (error) {
      this.el.innerHTML = error.toString()
      this.el.addClass('in-error')
      return
    } finally {
      this.el.removeClass('loading')
    }
    this.el.removeClass('in-error')

    this.el.empty()
    this.showIssueDetails()
    this.showTimeStats()
    this.showTransitionControls()
  }

  showIssueDetails(): void {
    if (!this.issue) {
      return
    }

    this.el.createDiv({
      text: `${this.issue.subject}`,
      cls: ['redmine-issue-title']
    })

    const subheader = this.el.createDiv({ cls: ['redmine-issue-details'] })
    subheader.createSpan({
      text: `${this.issue.id}`
    })
    subheader.createSpan({
      text: `${this.issue.project.name}`
    })
    if (this.issue.status) {
      subheader.createSpan({
        text: `${this.issue.status}`
      })
    }
    subheader.createEl('a', {
      attr: {
        rel: 'noopener',
        target: '_blank',
        href: path.join('http://' + this.plugin.settings.host + ':' + this.plugin.settings.port, 'issues', this.issue.id.toString()),
      },
      cls: ['external-link']
    });
  }

  showTransitionControls(): void {
    if (!this.issue) {
      return
    }

    // check obsidian-time-tracker plugin is installed or not
    if (!window.timeTrackerEventBus) {
      console.warn('Time Tracker plugin is not installed. Timer controls will not be displayed.');
      return; // not show timerControlContainer
  }

    // init timerControlContainer and add button
    this.timerControlContainer = this.el.createDiv({ cls: ['redmine-issue-timer-container'] });

    const startTimerButton = new ButtonComponent(this.timerControlContainer)
      .setIcon('time-tracker-play').setTooltip('Start Timer')
      .setClass('redmine-issue-start-timer-button')
      .onClick(() => this.startTimer());
  }

  showTimeStats(): void {
    const container = this.el.createDiv({ cls: ['redmine-issue-time-bar-container'] })
    const timeBar = container.createDiv({ cls: ['redmine-issue-time-bar'] })

    const { doneRatio, estimatedHours, spentHours } = this.issue.timeTracking
    if (estimatedHours && estimatedHours > 0) {
      const percentage = Math.ceil(spentHours / estimatedHours * 100)
      if (percentage <= 100) {
        timeBar.style.width = percentage + '%'
      } else {
        timeBar.style.width = '100%'

        const timeBarOverflow = timeBar.createDiv({ cls: ['redmine-issue-time-bar-overflow'] })
        timeBarOverflow.style.width = (percentage - 100) + '%'
      }
    } else {
      timeBar.style.width = Math.ceil(doneRatio) + '%'
    }
  }

  startTimer(): void {
    if (!window.timeTrackerEventBus) {
      console.warn('Time Tracker Event Bus is not initialized.');
      return;
    }

    // construct timer data
    const timerData = {
      id: this.issue.id,
      description: this.issue.subject,
      project: this.issue.project.name,
      startedAt: new Date(),
      tags: ['redmine']
    };

    // dispatch start timer event to time-tracker
    window.timeTrackerEventBus.dispatchEvent(new CustomEvent('starttimer', {
      detail: timerData
    }));

    // 更新 UI，提示計時器已啟動
    this.timerControlContainer.empty();
    const stopTimerButton = new ButtonComponent(this.timerControlContainer)
      .setIcon('time-tracker-stop').setTooltip('Stop Timer')
      .setClass('redmine-issue-stop-timer-button')
      .onClick(() => this.stopTimer());
    
    new Notice(`Timer started for issue: ${this.issue.id}`);
  }

  stopTimer(): void {
    if (!window.timeTrackerEventBus) {
      console.warn('Time Tracker Event Bus is not initialized.');
      return
    }

    // 假設 `timerData` 被存儲為屬性
    const timerData = {
      id: this.issue.id,
      description: this.issue.subject,
      endedAt: new Date()
    };

    // 發送停止事件
    window.timeTrackerEventBus.dispatchEvent(new CustomEvent('stoptimer', {
      detail: timerData
    }));

    // 更新 UI，提示計時器已停止
    this.timerControlContainer.empty();
    const startTimerButton = new ButtonComponent(this.timerControlContainer)
      //.setButtonText('Start Timer')
      .setIcon('time-tracker-play').setTooltip('Start Timer')
      .setClass('redmine-issue-start-timer-button')
      .onClick(() => this.startTimer());
    
    new Notice(`Timer stopped for issue: ${this.issue.id}`);
  }

}