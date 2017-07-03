# Kanro
Yet another backend framework

# 简介
Kanro 是一个基于 TypeScript/NodeJS 的 Web 后端框架，适用于一个纯粹的小型 API 服务应用，也可以将其拓展为十分庞大的微服务网络。其核心设计理念就是为小型 API 服务应用转型到大型后端应用，提供一个尽可能平滑的演变过程。

# 快速开始
## 使用 Quick Start 项目
由于 Kanro 涉及到工具链比较复杂，任何一个环节出错都有可能导致出现问题，所以特地提供了一个 [Quick Start 项目](https://github.com/ProjectMarduk/Kanro.QuickStart)，使用这个项目可以很轻松的开始使用 Kanro 构建后端应用。

### Node.js 环境
Kanro 运行在 Node.js 上，所以首先需要准备 Node.js。
从 https://nodejs.org/en/download/ 下载 NodeJS 安装程序，或者使用 apt-get, yum 等包管理器安装 NodeJS。推荐采用 [NVM](https://github.com/creationix/nvm) 来管理多版本的 Node.js。

使用 `node -v` 与 `npm -v` 来检查是否安装成功。
```PowerShell
> node -v
v6.11.0

> npm -v
3.10.10
```
### Typescript 工具链
Kanro 使用 [Typescript](http://www.typescriptlang.org) 作为开发语言，所以也推荐 Kanro App 使用 Typescript 作为开发语言，当然也可以使用原生的 Node.js 做开发，但是总的来说还是推荐 Typescript。

使用 `npm install typescript -g` 将 Typescript 安装到全局，通过 `tsc -v` 来检查安装是否成功。
```PowerShell
> tsc -v
Version 2.3.4
```
### Clone quick start 项目
使用 `git clone https://github.com/ProjectMarduk/Kanro.QuickStart.git` 或者在 Github 上直接下载 zip 包，并解压到本地，进入到项目目录中进行下一步操作。

### 准备工作
使用 `npm install` 安装项目所需要的依赖。默认依赖是 Kanro 与 Node 的 types 定义。

建立 log 文件夹，用于存放日志。

建立 resource 文件夹，用于静态资源。

运行 `tsc` 编译应用，生成编译后的 js 代码，存放在 bin 文件夹中。

### Hello Kanro!
使用 `npm start` 或者 `node bin/index.js` 来运行默认的 Kanro 应用。

```PowerShell
> npm start

[07/04 01:21:47]  Kanro:App        - [·] Booting... +0ms
[07/04 01:21:47]  Kanro:App        - [·] Create application context... +0ms
[07/04 01:21:48]  Kanro:Config     - [·] Unspecified config, searching for configs... +317ms
[07/04 01:21:48]  Kanro:App        - [·] Booting worker... +44ms
[07/04 01:21:48]  Kanro:NPM        - [·] Set NPM registry to 'http://localhost:4873'. +32ms
[07/04 01:21:48]  Kanro:Router     - [+] Router node '/' added. +4ms
[07/04 01:21:48]  Kanro:Router     - [+] Router node '/public/**' added. +1ms
[07/04 01:21:48]  Kanro:HTTP       - [+] Http server listening on '80'. +4ms
[07/04 01:21:48]  Kanro:App        - [+] Kanro is ready. +0ms
```

### 测试访问
访问 http://localhost/ 即可获取测试响应，访问 http://localhost/public/ 即可获取存放在 resource 文件夹的静态资源。
```Json
{
  "message": "Hello Kanro!"
}
```

# Logging with Kanro
Kanro 会在 `stdout` 与 `logger.json` 中指定的文件输出日志，stdout 中的支持彩色显示，文件中只有文本信息。
## 基本 log 格式
Kanro 的 Log 格式如下
```PowerShell
[07/04 01:21:47]  Kanro:App        - [·] Booting... +0ms
```
由 5 个部分组成：
1. 最前面的是打印当前 log 的时间，取服务器本地时间，带有月份，日期与具体时间信息。
2. 模块名，代表打印当前 log 的模块名，`Kanro:App` 代表由 Kanro 核心部分输出的 log，另外还有 `Kanro:Config` 用于打印配置相关的信息，`Kanro:HTTP` 用于打印 HTTP server 的状态与收到的请求日志。
3. 日志 level 标志，`[·]` 表示这是一条 info 级别的日志，主要是输出一些状态信息与追踪。`[+]` 表示这是一条 success 级别的日志，主要是一些模块的 ready 报告。`[!]` 表示这是一条 warning 级别的日志，一般是表示可能进行了导致应用不稳定的操作。`[x]` 表示这是一条 error 级别的日志，一般是应用中出现了异常。
4. 日志的内容，第四部分是日志的内容。
5. 距离上一次输出日志经过的时间。

## HTTP request log
另外在 HTTP 模块中还会打印所有的访问纪录，和普通的日志一样也有 5 个部分，但是在日志内容中又划分了几个部分。
```PowerShell
[07/04 01:49:55]  Kanro:HTTP       - [·] GET / 200 1ms  +6.73s
```
1. 请求的方法，纪录请求的方法，比如 GET，POST 等。
2. 请求的 url，会纪录请求的 URL
3. 响应的状态码，会记录当前请求的状态码。
4. 处理请求的耗时，会记录从收到请求到提供响应的所有耗时，并不包含网络耗时，所以会比实际的要小，可以用于诊断代码的效率问题。

## 输出目标
info 与 success 级别的日志会输出到 stdout 与 `logger.json` 的 logFile 中。
warning 与 error 级别的日志会输出到 stderr 与 `logger.json` 的 logFile 和 errorFile 中。

所以 logFile 保留了所有的日志输出，errorFile 用于监控错误的发生。

# 其他介绍
[Kanro:App - Quick start](http://blog.higan.me/quick-start-with-kanro/)