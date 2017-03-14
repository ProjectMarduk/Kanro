# Kanro
Yet another backend framework

## 简介
Kanro 是一个基于 TypeScript/NodeJS 的轻量级的后端框架，采用完全模块化的设计，拥有非常高的拓展性和可塑性，从“微服务”演变而来，提供更加轻量级的解决方案。  
在项目的初期就开始使用微服务框架基本是不太可能的，而在项目后期，如果在初期的时候没有一个好的后端框架设计，由单体应用转换为微服务的工作量是十分巨大的。  
而Kanro 就是为了解决这种问题而诞生，Kanro 的模块化的设计思想让每个模块之间尽量的解耦和。任何一个模块都能单独提取出来，运行在另一个 Kanro 示例中，而无需任何的代码改动。

## 快速开始
### 准备工作
01. 安装 NodeJS  
从 https://nodejs.org/en/download/ 下载 NodeJS 安装程序，或者使用 apt-get, yum 等包管理器安装 NodeJS。使用 `node -v` 来检查是否安装成功。
02. 安装 TypeScript  
使用 `npm install typescript -g` 将 TypeScript 安装到全局，通过 `tsc -v` 来检查安装是否成功。
03. 克隆项目  
使用 `git clone https://github.com/ProjectMarduk/Kanro.git` 将本项目克隆到本地。
04. 准备私有 npm 仓库  
推荐使用 [verdaccio](https://github.com/verdaccio/verdaccio) 来创建私有 npm 仓库。
### Hello World!
01. 安装依赖  
进入本地刚刚克隆好的 Kanro 项目文件夹，运行 `npm install` 来安装所有依赖。
> Note: 如果显示缺失 kanro.core 模块，请参考 [Kanro.Core](https://github.com/ProjectMarduk/Kanro.Core) 的说明，提交 kanro.core 到私有仓库。
02. 编译 Kanro  
运行 `tsc` 命令来编译 Kanro，并在根目录下生成 index.js。
03. 添加 DEBUG 环境变量来开启日志  
*nix 使用 `export DEBUG=Kanro:*` 导入 DEBUG 环境变量，Windows 采用 `set DEBUG=Kanro:*` 导入 DEBUG 环境变量。
04. 运行 Hello World
使用 `node index.js` 来运行 Hello World 示例。  
Kanro 会输出运行信息，如果看到 `Http server listening on '9180'` 则表示 Kanro 已经开始运行并侦听 HTTP 请求。
```
  Kanro:App       - [!] Initializing... +0ms
  Kanro:App       - [!] Load app config... +1ms
  Kanro:App       - [!] Load modules config... +81ms
  Kanro:App       - [!] Load services config... +1ms
  Kanro:App       - [!] Load executors config... +8ms
  Kanro:App       - [!] Check module status... +54ms
  Kanro:NPM       - [!] Set NPM registry to 'http://localhost:4873'. +21ms
  Kanro:App       - [!] Create services... +1ms
  Kanro:App       - [!] Initializing executors... +1ms
  Kanro:Router    - [+] Router node '/' added +1ms
  Kanro:App       - [!] Initialize http server... +1ms
  Kanro:HTTP      - [+] Http server listening on '9180' +5ms
```
通过浏览器或者其他工具，请求 `http://127.0.0.1:9180` 即可获得 Hello World 响应。
```JSON
{
  "status": 0,
  "message": "Normal",
  "data": "Hello Kanro!"
}
```
## 其他介绍
[Kanro - RESTful 后端框架（01）- 遇见 Kanro](http://blog.higan.me/kanro-restful-back-end-framework-1/)
