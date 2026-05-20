# ASR 自动化评估脚本

## 功能说明

该脚本用于自动化处理ASR（自动语音识别）评估任务，主要功能包括：

1. **浏览器自动化**：使用Selenium控制浏览器，自动点击按钮和获取页面元素
2. **音频录制**：录制页面播放的音频
3. **本地转写**：使用Google Web Speech API将音频转写为文本
4. **AI比较**：使用OpenAI API比较三个文本（本地转写和两个ASR结果），判断哪个更准确
5. **自动点击**：根据AI判断结果，自动点击对应的按钮

## 环境要求

- Python 3.7+
- Google Chrome 浏览器
- ChromeDriver（与Chrome版本匹配）

## 安装依赖

```bash
# 安装基础依赖
pip install selenium requests

# 安装音频处理依赖
pip install pyaudio SpeechRecognition
```

## 配置

1. **ChromeDriver**：下载与你的Chrome浏览器版本匹配的ChromeDriver，并放在脚本所在目录或系统PATH中

2. **API密钥**：在脚本中设置你的OpenAI API密钥

```python
# 替换为你的OpenAI API密钥
API_KEY = "your_openai_api_key"
```

3. **按钮坐标**：根据实际页面调整按钮坐标

```python
# 按钮坐标
CONTENT_ACTIVE_COORDS = (500, 280)
PLAY_BTN_COORDS = (68, 347)
FIRST_BTN_COORDS = (1230, 351)
SECOND_BTN_COORDS = (1340, 351)
BOTH_BAD_COORDS = (1451, 352)
```

## 使用方法

1. **启动脚本**：

```bash
python asr_automation.py
```

2. **脚本流程**：
   - 打开目标页面
   - 点击内容区域激活页面
   - 点击播放按钮播放音频
   - 录制音频
   - 本地转写音频
   - 获取页面上的两个ASR文本
   - 使用AI比较三个文本
   - 根据比较结果点击对应的按钮
   - 等待页面刷新，处理下一个任务

## 日志

脚本会生成 `asr_automation.log` 文件，记录运行过程中的详细信息。

## 注意事项

1. **网络连接**：确保网络连接稳定，特别是使用Google Web Speech API和OpenAI API时

2. **权限**：确保脚本有录制音频的权限

3. **ChromeDriver**：确保ChromeDriver版本与Chrome浏览器版本匹配

4. **API密钥**：确保OpenAI API密钥有效且有足够的额度

5. **坐标调整**：如果页面布局发生变化，需要重新调整按钮坐标

## 故障排除

- **音频录制失败**：检查麦克风权限和PyAudio安装
- **转写失败**：检查网络连接和Google Web Speech API可用性
- **AI比较失败**：检查OpenAI API密钥和网络连接
- **浏览器控制失败**：检查ChromeDriver版本和Chrome浏览器状态

## 示例输出

```
2026-04-26 10:00:00,000 - __main__ - INFO - 处理任务 1/5
2026-04-26 10:00:00,000 - __main__ - INFO - 点击内容区域激活页面
2026-04-26 10:00:01,000 - __main__ - INFO - 点击播放按钮
2026-04-26 10:00:01,000 - __main__ - INFO - 开始录制音频...
2026-04-26 10:00:11,000 - __main__ - INFO - 音频录制完成
2026-04-26 10:00:11,000 - __main__ - INFO - 开始转写音频...
2026-04-26 10:00:13,000 - __main__ - INFO - 转写结果: 这是一段测试音频
2026-04-26 10:00:13,000 - __main__ - INFO - ASR1: 这是一段测试音频
2026-04-26 10:00:13,000 - __main__ - INFO - ASR2: 这是一段测试音视频
2026-04-26 10:00:13,000 - __main__ - INFO - 本地转写: 这是一段测试音频
2026-04-26 10:00:15,000 - __main__ - INFO - AI判断结果: first
2026-04-26 10:00:15,000 - __main__ - INFO - 选择了第一个ASR
2026-04-26 10:00:18,000 - __main__ - INFO - 已清理临时文件: temp_audio.wav
```