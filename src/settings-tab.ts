import { App, Notice, PluginSettingTab, Setting } from 'obsidian'
import RedmineIssuePlugin from './main'

export default class RedmineIssueSettingTab extends PluginSettingTab {
	plugin: RedmineIssuePlugin;

	constructor(app: App, plugin: RedmineIssuePlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	async display(): Promise<void> {
		const { containerEl } = this

		containerEl.empty()

		new Setting(containerEl)
			.setName('Redmine host')
			.setDesc('The domain host of Redmine instance')
			.addText(text => text
				.setValue(this.plugin.settings.host)
				.setPlaceholder('my-host-name.com')
				.onChange(async (value) => {
					this.plugin.settings.host = value
					await this.plugin.saveSettings()
				}))
		
		new Setting(containerEl)
			.setName('Redmine port number')
			.setDesc('The domain port of Redmine instance')
			.addText(text => text
				.setValue(this.plugin.settings.port.toString())
				.setPlaceholder('443')
				.onChange(async (value) => {
					this.plugin.settings.port = parseInt(value)
					await this.plugin.saveSettings()
				}))
	
		new Setting(containerEl)
			.setName('API access key')
			.setDesc('The API token from account page')
			.addText(text => {
				text.inputEl.type = 'password'
				text.setValue(this.plugin.settings.token)
					.setPlaceholder('xxxxxxxxxxxxxxxxxxxxx')
					.onChange(async (value) => {
						this.plugin.settings.token = value
						await this.plugin.saveSettings()
					})
			})
		
		new Setting(containerEl)
			.setName('Test credentials')
			.setDesc('Retrieve current logged user')
			.addButton(button => button
				.setButtonText('test')
				.onClick(() => {
					button.setDisabled(true)
					this.plugin.redmineClient.getUser()
					.then(user => {
						new Notice(`Successfully logged in as ${user.login}`)
					})
					.catch(error => {
						new Notice(`Error: ${error}`)
					})
					.finally(() => {
						button.setDisabled(false)
					})
				}))

		new Setting(containerEl)
			.setName('Working day hours')
			.setDesc('The number of hours to track in a working day')
			.addText(text => text
				.setValue(this.plugin.settings.dayHours.toString())
				.onChange(async (value) => {
					this.plugin.settings.dayHours = parseInt(value)
					await this.plugin.saveSettings()
				}))
		
		new Setting(containerEl)
			.setName('RD Function Team')
			.setDesc('Select the team to which you belong')
			.addDropdown(dropdown => {
				const options = {
					'SW_Platform_management': 'SW Platform Management',
					'SW_OS/BSP': 'SW OS/BSP',
					'SW_Networking': 'SW Networking',
					'SW_APTC': 'SW APTC',
					'SW_PM': 'SW PM',
					'SW_QA': 'SW QA',
					'BIOS': 'BIOS',
					'EE1': 'EE1',
					'EE2': 'EE2',
					'EE3': 'EE3',
					'EE4': 'EE4',
					'N/A': 'N/A',
					'SE': 'SE',
					'ME': 'ME',
					'Thermal': 'Thermal',
				}
		
				// 添加選項到下拉式選單
				Object.entries(options).forEach(([value, label]) => {
					dropdown.addOption(value, label)
				})
		
				// 設置當前選中值
				dropdown.setValue(this.plugin.settings.functionTeam)
		
				// 註冊改變事件
				dropdown.onChange(async(value) => {
					this.plugin.settings.functionTeam = value
					await this.plugin.saveSettings()
				})
			})
	}
}
