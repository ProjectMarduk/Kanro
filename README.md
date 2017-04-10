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
03. 准备私有 npm 仓库  
推荐使用 [verdaccio](https://github.com/verdaccio/verdaccio) 来创建私有 npm 仓库。  
04. 创建一个 npm 项目  
新建一个文件夹，使用 `npm init` 与 `tsc init` 来初始化一个空项目。  

### Hello World!
01. 安装 Kanro  
使用 `npm install kanro --save` 来未项目安装 Kanro。
02. 在代码中创建 Kanro 应用  
下面的代码创建一个默认的 Kanro 应用。  
```TypeScript
import { Kanro } from "kanro";

let app = new Kanro.Core.Application();
app.main();
```
03. 编译 Kanro  
运行 `tsc` 命令来编译 项目。

04. 添加 DEBUG 环境变量来开启日志  
*nix 使用 `export DEBUG=Kanro:*` 导入 DEBUG 环境变量，Windows 采用 `set DEBUG=Kanro:*` 导入 DEBUG 环境变量。

05. 运行 Hello World
使用 `node index.js` 来运行 Hello World 示例。  
Kanro 会输出运行信息，如果看到 `Kanro is ready.` 则表示 Kanro 已经开始运行并侦听 HTTP 请求。

```
  Kanro:App       - [!] Booting... +0ms
  Kanro:Config    - [!] Unspecified configs, searching for configs... +1ms
  Kanro:App       - [!] Create application context... +105ms
  Kanro:App       - [!] Booting HTTP server... +1ms
  Kanro:App       - [!] Initializing... +3ms
  Kanro:App       - [!] Check module status... +0ms
  Kanro:HTTP      - [+] Http server listening on '80' +0ms
  Kanro:NPM       - [!] Set NPM registry to 'http://localhost:4873'. +17ms
  Kanro:App       - [!] Create services... +0ms
  Kanro:App       - [!] Initializing executors... +1ms
  Kanro:Router    - [+] Router node '/' added +1ms
  Kanro:Router    - [+] Router node '/public/**' added +1ms
  Kanro:App       - [+] Kanro is ready. +1ms
```
通过浏览器或者其他工具，请求 `http://127.0.0.1:80` 即可获得 Hello World 响应。
```JSON
{
  "message": "Hello Kanro!"
}
```
## 其他介绍
[Kanro - RESTful 后端框架（01）- 遇见 Kanro](http://blog.higan.me/kanro-restful-back-end-framework-1/)
