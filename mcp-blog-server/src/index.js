#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var axios_1 = require("axios");
var zod_1 = require("zod");
// 配置验证模式
var configSchema = zod_1.z.object({
    apiBaseUrl: zod_1.z.string().default('http://localhost:3000/api'),
    authToken: zod_1.z.string().optional(),
});
// 文章创建参数验证
var createPostSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, '标题不能为空'),
    content: zod_1.z.string().optional(),
    published: zod_1.z.boolean().default(false),
});
// 文章更新参数验证
var updatePostSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive('文章ID必须是正整数'),
    title: zod_1.z.string().min(1).optional(),
    content: zod_1.z.string().optional(),
    published: zod_1.z.boolean().optional(),
});
var BlogMCPServer = /** @class */ (function () {
    function BlogMCPServer() {
        this.server = new index_js_1.Server({
            name: 'blog-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        // 从环境变量读取配置
        this.config = configSchema.parse({
            apiBaseUrl: process.env.BLOG_API_URL || 'http://localhost:3000/api',
            authToken: process.env.BLOG_AUTH_TOKEN,
        });
        this.setupHandlers();
    }
    BlogMCPServer.prototype.setupHandlers = function () {
        var _this = this;
        // 列出可用工具
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        tools: [
                            {
                                name: 'create_post',
                                description: '创建新的博客文章',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        title: {
                                            type: 'string',
                                            description: '文章标题',
                                        },
                                        content: {
                                            type: 'string',
                                            description: '文章内容（支持Markdown格式）',
                                        },
                                        published: {
                                            type: 'boolean',
                                            description: '是否立即发布（默认为false，保存为草稿）',
                                            default: false,
                                        },
                                    },
                                    required: ['title'],
                                },
                            },
                            {
                                name: 'update_post',
                                description: '更新现有的博客文章',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        id: {
                                            type: 'number',
                                            description: '文章ID',
                                        },
                                        title: {
                                            type: 'string',
                                            description: '文章标题',
                                        },
                                        content: {
                                            type: 'string',
                                            description: '文章内容',
                                        },
                                        published: {
                                            type: 'boolean',
                                            description: '是否发布',
                                        },
                                    },
                                    required: ['id'],
                                },
                            },
                            {
                                name: 'publish_post',
                                description: '发布指定的文章',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        id: {
                                            type: 'number',
                                            description: '要发布的文章ID',
                                        },
                                    },
                                    required: ['id'],
                                },
                            },
                            {
                                name: 'list_posts',
                                description: '获取文章列表',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        published: {
                                            type: 'boolean',
                                            description: '筛选已发布或草稿文章（不指定则返回所有）',
                                        },
                                    },
                                },
                            },
                            {
                                name: 'set_auth_token',
                                description: '设置认证令牌',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        token: {
                                            type: 'string',
                                            description: 'JWT认证令牌',
                                        },
                                    },
                                    required: ['token'],
                                },
                            },
                        ],
                    }];
            });
        }); });
        // 处理工具调用
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(_this, void 0, void 0, function () {
            var _a, name, args, _b, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = request.params, name = _a.name, args = _a.arguments;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 14, , 15]);
                        _b = name;
                        switch (_b) {
                            case 'create_post': return [3 /*break*/, 2];
                            case 'update_post': return [3 /*break*/, 4];
                            case 'publish_post': return [3 /*break*/, 6];
                            case 'list_posts': return [3 /*break*/, 8];
                            case 'set_auth_token': return [3 /*break*/, 10];
                        }
                        return [3 /*break*/, 12];
                    case 2: return [4 /*yield*/, this.createPost(args)];
                    case 3: return [2 /*return*/, _c.sent()];
                    case 4: return [4 /*yield*/, this.updatePost(args)];
                    case 5: return [2 /*return*/, _c.sent()];
                    case 6: return [4 /*yield*/, this.publishPost(args)];
                    case 7: return [2 /*return*/, _c.sent()];
                    case 8: return [4 /*yield*/, this.listPosts(args)];
                    case 9: return [2 /*return*/, _c.sent()];
                    case 10: return [4 /*yield*/, this.setAuthToken(args)];
                    case 11: return [2 /*return*/, _c.sent()];
                    case 12: throw new Error("\u672A\u77E5\u7684\u5DE5\u5177: ".concat(name));
                    case 13: return [3 /*break*/, 15];
                    case 14:
                        error_1 = _c.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "\u9519\u8BEF: ".concat(error_1 instanceof Error ? error_1.message : '未知错误'),
                                    },
                                ],
                            }];
                    case 15: return [2 /*return*/];
                }
            });
        }); });
    };
    BlogMCPServer.prototype.createPost = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var validatedArgs, response, post, status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validatedArgs = createPostSchema.parse(args);
                        if (!this.config.authToken) {
                            throw new Error('请先使用 set_auth_token 设置认证令牌');
                        }
                        return [4 /*yield*/, axios_1.default.post("".concat(this.config.apiBaseUrl, "/posts"), validatedArgs, {
                                headers: {
                                    Authorization: "Bearer ".concat(this.config.authToken),
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        post = response.data;
                        status = post.published ? '已发布' : '已保存为草稿';
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "\u2705 \u6587\u7AE0\u521B\u5EFA\u6210\u529F\uFF01\n\n\uD83D\uDCDD \u6807\u9898: ".concat(post.title, "\n\uD83D\uDCCA \u72B6\u6001: ").concat(status, "\n\uD83C\uDD94 \u6587\u7AE0ID: ").concat(post.id, "\n\u23F0 \u521B\u5EFA\u65F6\u95F4: ").concat(new Date(post.createdAt).toLocaleString('zh-CN')),
                                    },
                                ],
                            }];
                }
            });
        });
    };
    BlogMCPServer.prototype.updatePost = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var validatedArgs, id, updateData, response, post, status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validatedArgs = updatePostSchema.parse(args);
                        if (!this.config.authToken) {
                            throw new Error('请先使用 set_auth_token 设置认证令牌');
                        }
                        id = validatedArgs.id, updateData = __rest(validatedArgs, ["id"]);
                        return [4 /*yield*/, axios_1.default.put("".concat(this.config.apiBaseUrl, "/posts/").concat(id), updateData, {
                                headers: {
                                    Authorization: "Bearer ".concat(this.config.authToken),
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        post = response.data;
                        status = post.published ? '已发布' : '草稿';
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "\u2705 \u6587\u7AE0\u66F4\u65B0\u6210\u529F\uFF01\n\n\uD83D\uDCDD \u6807\u9898: ".concat(post.title, "\n\uD83D\uDCCA \u72B6\u6001: ").concat(status, "\n\uD83C\uDD94 \u6587\u7AE0ID: ").concat(post.id, "\n\u23F0 \u66F4\u65B0\u65F6\u95F4: ").concat(new Date(post.updatedAt).toLocaleString('zh-CN')),
                                    },
                                ],
                            }];
                }
            });
        });
    };
    BlogMCPServer.prototype.publishPost = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var id, response, post;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = zod_1.z.object({ id: zod_1.z.number() }).parse(args).id;
                        if (!this.config.authToken) {
                            throw new Error('请先使用 set_auth_token 设置认证令牌');
                        }
                        return [4 /*yield*/, axios_1.default.patch("".concat(this.config.apiBaseUrl, "/posts/").concat(id, "/publish"), {}, {
                                headers: {
                                    Authorization: "Bearer ".concat(this.config.authToken),
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        post = response.data;
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "\uD83D\uDE80 \u6587\u7AE0\u53D1\u5E03\u6210\u529F\uFF01\n\n\uD83D\uDCDD \u6807\u9898: ".concat(post.title, "\n\uD83C\uDD94 \u6587\u7AE0ID: ").concat(post.id, "\n\u23F0 \u53D1\u5E03\u65F6\u95F4: ").concat(new Date().toLocaleString('zh-CN')),
                                    },
                                ],
                            }];
                }
            });
        });
    };
    BlogMCPServer.prototype.listPosts = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var published, params, response, posts, postList;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        published = zod_1.z.object({ published: zod_1.z.boolean().optional() }).parse(args).published;
                        if (!this.config.authToken) {
                            throw new Error('请先使用 set_auth_token 设置认证令牌');
                        }
                        params = published !== undefined ? { published: published } : {};
                        return [4 /*yield*/, axios_1.default.get("".concat(this.config.apiBaseUrl, "/posts"), {
                                params: params,
                                headers: {
                                    Authorization: "Bearer ".concat(this.config.authToken),
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        posts = response.data;
                        if (posts.length === 0) {
                            return [2 /*return*/, {
                                    content: [
                                        {
                                            type: 'text',
                                            text: '📝 暂无文章',
                                        },
                                    ],
                                }];
                        }
                        postList = posts
                            .map(function (post) {
                            var status = post.published ? '✅ 已发布' : '📝 草稿';
                            var date = new Date(post.createdAt).toLocaleDateString('zh-CN');
                            return "".concat(post.id, ". ").concat(post.title, " (").concat(status, ") - ").concat(date);
                        })
                            .join('\n');
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "\uD83D\uDCDA \u6587\u7AE0\u5217\u8868 (\u5171 ".concat(posts.length, " \u7BC7):\n\n").concat(postList),
                                    },
                                ],
                            }];
                }
            });
        });
    };
    BlogMCPServer.prototype.setAuthToken = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                token = zod_1.z.object({ token: zod_1.z.string() }).parse(args).token;
                this.config.authToken = token;
                return [2 /*return*/, {
                        content: [
                            {
                                type: 'text',
                                text: '🔐 认证令牌设置成功！现在可以使用其他功能了。',
                            },
                        ],
                    }];
            });
        });
    };
    BlogMCPServer.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var transport;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transport = new stdio_js_1.StdioServerTransport();
                        return [4 /*yield*/, this.server.connect(transport)];
                    case 1:
                        _a.sent();
                        console.error('博客MCP服务器已启动');
                        return [2 /*return*/];
                }
            });
        });
    };
    return BlogMCPServer;
}());
var server = new BlogMCPServer();
server.run().catch(console.error);
