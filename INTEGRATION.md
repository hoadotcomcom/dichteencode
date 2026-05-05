# Modeldiscount Proxy — Integration Guide

> **Một URL, một API key — truy cập mọi AI model.**
>
> Proxy hoạt động như trạm trung chuyện: app gửi request đến proxy bằng SDK gốc (OpenAI/Anthropic),
> proxy tự detect provider, convert format nếu cần, và forward đến upstream.
> App không cần biết model nào ở provider nào.

---

## Mục lục

- [1. Quick Start (1 phút)](#1-quick-start-1-phút)
- [2. Kiến trúc](#2-kiến-trúc)
- [3. Xác thực (Authentication)](#3-xác-thực-authentication)
- [4. API Endpoints](#4-api-endpoints)
- [5. Models có sẵn](#5-models-có-sẵn)
- [6. Python — OpenAI SDK](#6-python--openai-sdk)
- [7. Python — Anthropic SDK](#7-python--anthropic-sdk)
- [8. Python — httpx / requests (HTTP thuần)](#8-python--httpx--requests-http-thuần)
- [9. Node.js / TypeScript](#9-nodejs--typescript)
- [10. cURL](#10-curl)
- [11. Streaming](#11-streaming)
- [12. JSON Structured Output](#12-json-structured-output)
- [13. Multi-turn Conversation](#13-multi-turn-conversation)
- [14. System Prompt](#14-system-prompt)
- [15. Tool Calling / Function Calling](#15-tool-calling--function-calling)
- [16. Xử lý lỗi (Error Handling)](#16-xử-lý-lỗi-error-handling)
- [17. Tích hợp Framework](#17-tích-hợp-framework)
- [18. Migration từ API trực tiếp](#18-migration-từ-api-trực-tiếp)
- [19. Best Practices](#19-best-practices)
- [20. Troubleshooting](#20-troubleshooting)

---

## 1. Quick Start (1 phút)

### Bước 1: Cài đặt SDK

```bash
# Python
pip install openai

# Node.js
npm install openai
```

### Bước 2: Cấu hình

```
PROXY_URL = "http://<proxy-host>:9000"
API_KEY   = "<lấy từ dashboard proxy>"
```

### Bước 3: Gọi API

```python
from openai import OpenAI

client = OpenAI(api_key="<API_KEY>", base_url="http://<proxy-host>:9000/v1")

response = client.chat.completions.create(
    model="claude-sonnet-4.6",   # Hoặc "gpt-5-mini", "claude-opus-4.6"...
    messages=[{"role": "user", "content": "Xin chào!"}],
    max_tokens=256,
)
print(response.choices[0].message.content)
```

**Xong!** Chỉ thay `base_url` — mọi thứ khác giữ nguyên như gọi OpenAI/Anthropic trực tiếp.

---

## 2. Kiến trúc

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  App của bạn  │────▶│  Proxy :9000     │────▶│  AI Providers    │
│  (SDK gốc)    │◀────│  (auto-routing)  │◀────│  (OpenAI, Claude)│
└──────────────┘     └──────────────────┘     └──────────────────┘
```

**Proxy tự động:**
- Detect provider dựa trên model name
- Chọn API key (round-robin load balancing)
- Convert format nếu cần (OpenAI ↔ Anthropic)
- Retry + fallback nếu provider lỗi
- Sanitize parameters cho reasoning models (o1, o3, gpt-5...)

**App chỉ cần:**
- 1 URL (`http://proxy:9000`)
- 1 API key
- Đổi `model` để switch giữa các AI

---

## 3. Xác thực (Authentication)

Proxy hỗ trợ 2 cách xác thực:

### Bearer Token (OpenAI SDK, HTTP)

```
Authorization: Bearer <API_KEY>
```

### X-API-Key Header (Anthropic SDK)

```
x-api-key: <API_KEY>
```

> **Lưu ý:** Cả hai header dùng chung 1 API key. SDK tự thêm header phù hợp —
> bạn chỉ cần truyền `api_key` khi khởi tạo client.

---

## 4. API Endpoints

| Method | Endpoint | Mô tả | SDK tương ứng |
|--------|----------|--------|---------------|
| `POST` | `/v1/chat/completions` | Chat completions (OpenAI-compatible) | OpenAI SDK |
| `POST` | `/v1/messages` | Messages (Anthropic-compatible) | Anthropic SDK |
| `POST` | `/chat` | Alias của `/v1/chat/completions` | HTTP thuần |
| `GET`  | `/v1/models` | Danh sách models có sẵn | Cả hai SDK |

### Khi nào dùng endpoint nào?

| Tình huống | Endpoint | Lý do |
|------------|----------|-------|
| App dùng OpenAI SDK | `/v1/chat/completions` | SDK tự thêm path |
| App dùng Anthropic SDK | `/v1/messages` | SDK tự thêm path |
| App gọi HTTP thuần | `/v1/chat/completions` | Chuẩn OpenAI, đơn giản nhất |
| Gọi Claude bằng OpenAI SDK | `/v1/chat/completions` | Proxy auto-convert format |
| Gọi GPT bằng Anthropic SDK | Không hỗ trợ | Dùng OpenAI SDK |

---

## 5. Models có sẵn

| Model | Provider | Ghi chú |
|-------|----------|---------|
| `gpt-5.4` | OpenAI | Flagship model |
| `gpt-5-mini` | OpenAI | Fast, cost-effective |
| `claude-sonnet-4.6` | Anthropic | Balanced |
| `claude-opus-4.6` | Anthropic | Most capable |
| `claude-sonnet-4.5` | Anthropic | Previous gen |
| `gemini-3.1-pro-preview` | Google | ✅ Dùng OpenAI SDK — xem ghi chú |

> **Ghi chú Gemini:** Google Gemini SDK (`google.generativeai`) **không hỗ trợ custom `base_url`**,
> nên **không thể dùng Gemini SDK** để gọi qua proxy. Thay vào đó, dùng **OpenAI SDK** — proxy sẽ tự convert format.
>
> ```python
> # Gọi Gemini qua proxy bằng OpenAI SDK — hoạt động bình thường!
> client = OpenAI(api_key=API_KEY, base_url=f"{PROXY_URL}/v1")
> resp = client.chat.completions.create(
>     model="gemini-3.1-pro-preview",
>     messages=[{"role": "user", "content": "Xin chào!"}],
> )
> ```
>
> Hỗ trợ đầy đủ: non-streaming, streaming, structured JSON (`response_format`), multi-turn, system prompt.

> **Danh sách mới nhất:**
> ```
> GET /v1/models
> Authorization: Bearer <API_KEY>
> ```

### Lấy danh sách models bằng code

```python
# Python (OpenAI SDK)
client = OpenAI(api_key=API_KEY, base_url=f"{PROXY_URL}/v1")
models = client.models.list()
for m in models.data:
    print(f"  {m.id} → {m.owned_by}")
```

```javascript
// Node.js
const models = await client.models.list();
models.data.forEach(m => console.log(`  ${m.id} → ${m.owned_by}`));
```

```bash
# cURL
curl -s "$PROXY_URL/v1/models" -H "Authorization: Bearer $API_KEY" | python -m json.tool
```

---

## 6. Python — OpenAI SDK

> **Khuyến nghị cho hầu hết app.** Một client gọi được tất cả models (GPT, Claude, Gemini).

### Cài đặt

```bash
pip install openai
```

### Khởi tạo client

```python
from openai import OpenAI

PROXY_URL = "http://<proxy-host>:9000"
API_KEY = "<your-api-key>"

client = OpenAI(
    api_key=API_KEY,
    base_url=f"{PROXY_URL}/v1",  # Quan trọng: thêm /v1
)
```

### Chat cơ bản

```python
response = client.chat.completions.create(
    model="claude-sonnet-4.6",
    messages=[{"role": "user", "content": "Giải thích machine learning ngắn gọn."}],
    max_tokens=500,
)
print(response.choices[0].message.content)
print(f"Tokens: {response.usage.total_tokens}")
```

### Đổi model — không cần đổi gì khác

```python
# Gọi Claude
resp1 = client.chat.completions.create(model="claude-sonnet-4.6", messages=messages, max_tokens=500)

# Gọi GPT — cùng client, cùng URL
resp2 = client.chat.completions.create(model="gpt-5-mini", messages=messages, max_tokens=500)

# Gọi Claude Opus — cùng client, cùng URL
resp3 = client.chat.completions.create(model="claude-opus-4.6", messages=messages, max_tokens=500)
```

### Streaming

```python
stream = client.chat.completions.create(
    model="claude-sonnet-4.6",
    messages=[{"role": "user", "content": "Kể một câu chuyện ngắn."}],
    max_tokens=1000,
    stream=True,
)
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
print()  # Newline
```

### Async (cho FastAPI, async apps)

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=API_KEY, base_url=f"{PROXY_URL}/v1")

async def chat(message: str) -> str:
    response = await client.chat.completions.create(
        model="claude-sonnet-4.6",
        messages=[{"role": "user", "content": message}],
        max_tokens=500,
    )
    return response.choices[0].message.content
```

---

## 7. Python — Anthropic SDK

> Dùng khi app cần Anthropic-native features hoặc đã có code Anthropic SDK.

### Cài đặt

```bash
pip install anthropic
```

### Khởi tạo client

```python
from anthropic import Anthropic

PROXY_URL = "http://<proxy-host>:9000"
API_KEY = "<your-api-key>"

client = Anthropic(
    api_key=API_KEY,
    base_url=PROXY_URL,  # Không thêm /v1 (SDK tự thêm /v1/messages)
)
```

### Chat cơ bản

```python
response = client.messages.create(
    model="claude-sonnet-4.6",
    max_tokens=500,
    messages=[{"role": "user", "content": "Xin chào!"}],
)
# Anthropic trả về content blocks — lấy text block
for block in response.content:
    if hasattr(block, 'text'):
        print(block.text)
        break
```

### Với System Prompt

```python
response = client.messages.create(
    model="claude-sonnet-4.6",
    max_tokens=500,
    system="Bạn là trợ lý AI chuyên về lập trình Python. Trả lời ngắn gọn.",
    messages=[{"role": "user", "content": "List comprehension là gì?"}],
)
```

### Streaming

```python
with client.messages.stream(
    model="claude-sonnet-4.6",
    max_tokens=1000,
    messages=[{"role": "user", "content": "Kể một câu chuyện ngắn."}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
print()
```

### Async

```python
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=API_KEY, base_url=PROXY_URL)

async def chat(message: str) -> str:
    response = await client.messages.create(
        model="claude-sonnet-4.6",
        max_tokens=500,
        messages=[{"role": "user", "content": message}],
    )
    for block in response.content:
        if hasattr(block, 'text'):
            return block.text
    return ""
```

---

## 8. Python — httpx / requests (HTTP thuần)

> Khi không muốn cài SDK, hoặc cần kiểm soát HTTP level.

### httpx (async)

```python
import httpx

PROXY_URL = "http://<proxy-host>:9000"
API_KEY = "<your-api-key>"

async def chat(message: str, model: str = "claude-sonnet-4.6") -> str:
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            f"{PROXY_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": message}],
                "max_tokens": 500,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
```

### requests (sync)

```python
import requests

def chat(message: str, model: str = "claude-sonnet-4.6") -> str:
    response = requests.post(
        f"{PROXY_URL}/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [{"role": "user", "content": message}],
            "max_tokens": 500,
        },
        timeout=120,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]
```

### Streaming qua HTTP thuần

```python
import httpx
import json

async def chat_stream(message: str, model: str = "claude-sonnet-4.6"):
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            f"{PROXY_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": message}],
                "max_tokens": 1000,
                "stream": True,
            },
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    chunk = json.loads(data)
                    content = chunk["choices"][0].get("delta", {}).get("content", "")
                    if content:
                        print(content, end="", flush=True)
    print()
```

---

## 9. Node.js / TypeScript

### Cài đặt

```bash
npm install openai
```

### Chat cơ bản

```typescript
import OpenAI from "openai";

const PROXY_URL = "http://<proxy-host>:9000";
const API_KEY = "<your-api-key>";

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: `${PROXY_URL}/v1`,
});

async function chat(message: string, model: string = "claude-sonnet-4.6") {
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: message }],
    max_tokens: 500,
  });
  return response.choices[0].message.content;
}

// Sử dụng
const answer = await chat("Xin chào!");
console.log(answer);
```

### Streaming

```typescript
const stream = await client.chat.completions.create({
  model: "claude-sonnet-4.6",
  messages: [{ role: "user", content: "Kể một câu chuyện ngắn." }],
  max_tokens: 1000,
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}
console.log();
```

### Anthropic SDK (Node.js)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: API_KEY,
  baseURL: PROXY_URL,  // Không thêm /v1
});

const response = await client.messages.create({
  model: "claude-sonnet-4.6",
  max_tokens: 500,
  messages: [{ role: "user", content: "Xin chào!" }],
});

console.log(response.content[0].text);
```

### fetch (không cần SDK)

```typescript
async function chat(message: string, model: string = "claude-sonnet-4.6") {
  const response = await fetch(`${PROXY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: message }],
      max_tokens: 500,
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content;
}
```

---

## 10. cURL

### Chat cơ bản

```bash
curl http://<proxy-host>:9000/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4.6",
    "messages": [{"role": "user", "content": "Xin chào!"}],
    "max_tokens": 256
  }'
```

### Streaming

```bash
curl http://<proxy-host>:9000/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "model": "claude-sonnet-4.6",
    "messages": [{"role": "user", "content": "Kể chuyện ngắn"}],
    "max_tokens": 500,
    "stream": true
  }'
```

### Lấy danh sách models

```bash
curl http://<proxy-host>:9000/v1/models \
  -H "Authorization: Bearer $API_KEY"
```

---

## 11. Streaming

Proxy hỗ trợ streaming cho tất cả models và cả hai endpoints.

### OpenAI SDK streaming

```python
stream = client.chat.completions.create(
    model="claude-sonnet-4.6",  # Hoặc bất kỳ model nào
    messages=[{"role": "user", "content": "Viết bài thơ ngắn."}],
    max_tokens=500,
    stream=True,
)

full_response = ""
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        text = chunk.choices[0].delta.content
        full_response += text
        print(text, end="", flush=True)
print()
```

### Anthropic SDK streaming

```python
with anthropic_client.messages.stream(
    model="claude-sonnet-4.6",
    max_tokens=500,
    messages=[{"role": "user", "content": "Viết bài thơ ngắn."}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
print()
```

### Server-Sent Events (SSE) format

Proxy trả streaming theo chuẩn SSE:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"Xin"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":" chào"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

---

## 12. JSON Structured Output

Proxy hỗ trợ 2 cách lấy JSON response:

### Cách 1: `response_format` (GPT & Gemini)

Dùng `response_format={"type": "json_object"}` — model trả về JSON thuần, không cần parse markdown.

```python
import json

response = client.chat.completions.create(
    model="gemini-3.1-pro-preview",  # Hoặc gpt-5-mini, gpt-5.4
    messages=[
        {"role": "system", "content": "Bạn là trợ lý AI. Luôn trả lời bằng JSON."},
        {"role": "user", "content": "Liệt kê 3 thành phố lớn nhất Việt Nam với dân số. Trả về JSON array."},
    ],
    response_format={"type": "json_object"},
)

data = json.loads(response.choices[0].message.content)
print(json.dumps(data, indent=2, ensure_ascii=False))
```

> ⚠️ **Lưu ý:** `response_format` chỉ hoạt động với **GPT** và **Gemini** models.
> Claude models không hỗ trợ — dùng **Cách 2** (prompt-based) thay thế.

### Cách 2: Prompt-based JSON (tất cả models)

Hoạt động với mọi model (Claude, GPT, Gemini) — dùng prompt yêu cầu trả JSON.

```python
import json

response = client.chat.completions.create(
    model="claude-sonnet-4.6",
    messages=[{"role": "user", "content": (
        "Phân tích câu sau: 'Hà Nội là thủ đô của Việt Nam.' "
        "IMPORTANT: Reply ONLY with a valid JSON object, no markdown, no explanation. "
        'Format: {"subject": "...", "predicate": "...", "object": "..."}'
    )}],
    max_tokens=500,
)

raw = response.choices[0].message.content

# Strip markdown code fences nếu model trả về ```json...```
clean = raw.strip()
if clean.startswith("```"):
    clean = "\n".join(clean.split("\n")[1:])
    if clean.endswith("```"):
        clean = clean[:-3]
    clean = clean.strip()

result = json.loads(clean)
print(result)
# {"subject": "Hà Nội", "predicate": "là", "object": "thủ đô của Việt Nam"}
```

### Helper function tiện dụng

```python
import json

def chat_json(client, model: str, prompt: str, schema_example: dict, max_tokens: int = 500) -> dict:
    """Gọi AI và parse response thành JSON."""
    schema_str = json.dumps(schema_example, ensure_ascii=False)
    full_prompt = (
        f"{prompt} "
        f"IMPORTANT: Reply ONLY with a valid JSON object, no markdown, no explanation. "
        f"Format: {schema_str}"
    )
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": full_prompt}],
        max_tokens=max_tokens,
    )
    raw = response.choices[0].message.content or ""
    clean = raw.strip()
    if clean.startswith("```"):
        clean = "\n".join(clean.split("\n")[1:])
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()
    return json.loads(clean)


# Sử dụng
result = chat_json(
    client,
    model="claude-sonnet-4.6",
    prompt="Tính 15 * 4 + 20 = ? Giải thích từng bước.",
    schema_example={"expression": "15*4+20", "steps": ["step1", "step2"], "answer": 80}
)
print(f"Đáp án: {result['answer']}")
```

---

## 13. Multi-turn Conversation

Gửi lịch sử hội thoại qua mảng `messages`:

### OpenAI SDK

```python
messages = [
    {"role": "system", "content": "Bạn là trợ lý toán học. Trả lời ngắn gọn."},
    {"role": "user", "content": "x = 10"},
    {"role": "assistant", "content": "OK, x = 10."},
    {"role": "user", "content": "y = x * 3"},
    {"role": "assistant", "content": "OK, y = 30."},
    {"role": "user", "content": "z = x + y. z = ?"},
]

response = client.chat.completions.create(
    model="claude-sonnet-4.6",
    messages=messages,
    max_tokens=100,
)
print(response.choices[0].message.content)  # "z = 40"
```

### Anthropic SDK

```python
response = anthropic_client.messages.create(
    model="claude-sonnet-4.6",
    max_tokens=100,
    system="Bạn là trợ lý toán học. Trả lời ngắn gọn.",
    messages=[
        {"role": "user", "content": "x = 10"},
        {"role": "assistant", "content": "OK, x = 10."},
        {"role": "user", "content": "y = x * 3"},
        {"role": "assistant", "content": "OK, y = 30."},
        {"role": "user", "content": "z = x + y. z = ?"},
    ],
)
```

### Chatbot pattern

```python
class Chatbot:
    def __init__(self, model: str = "claude-sonnet-4.6", system: str = ""):
        self.client = OpenAI(api_key=API_KEY, base_url=f"{PROXY_URL}/v1")
        self.model = model
        self.messages = []
        if system:
            self.messages.append({"role": "system", "content": system})

    def chat(self, user_message: str) -> str:
        self.messages.append({"role": "user", "content": user_message})
        response = self.client.chat.completions.create(
            model=self.model,
            messages=self.messages,
            max_tokens=1000,
        )
        assistant_message = response.choices[0].message.content
        self.messages.append({"role": "assistant", "content": assistant_message})
        return assistant_message


# Sử dụng
bot = Chatbot(model="claude-sonnet-4.6", system="Bạn là trợ lý AI thân thiện.")
print(bot.chat("Xin chào!"))
print(bot.chat("Tên bạn là gì?"))
print(bot.chat("Bạn có thể giúp gì cho tôi?"))
```

---

## 14. System Prompt

### OpenAI SDK

```python
response = client.chat.completions.create(
    model="claude-sonnet-4.6",
    messages=[
        {"role": "system", "content": "Bạn là chuyên gia Python. Trả lời bằng code examples."},
        {"role": "user", "content": "Làm sao đọc file CSV?"},
    ],
    max_tokens=500,
)
```

### Anthropic SDK

```python
response = anthropic_client.messages.create(
    model="claude-sonnet-4.6",
    max_tokens=500,
    system="Bạn là chuyên gia Python. Trả lời bằng code examples.",
    messages=[{"role": "user", "content": "Làm sao đọc file CSV?"}],
)
```

> **Lưu ý:** OpenAI SDK dùng `system` role trong messages array.
> Anthropic SDK dùng `system` parameter riêng. Proxy xử lý cả hai.

---

## 15. Tool Calling / Function Calling

Proxy hỗ trợ tool calling và tự convert format giữa OpenAI ↔ Anthropic.

### Định nghĩa tools

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Lấy thông tin thời tiết hiện tại",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "Tên thành phố, ví dụ: Hà Nội",
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Đơn vị nhiệt độ",
                    },
                },
                "required": ["location"],
            },
        },
    },
]
```

### Gọi với tools

```python
response = client.chat.completions.create(
    model="claude-sonnet-4.6",
    messages=[{"role": "user", "content": "Thời tiết ở Hà Nội thế nào?"}],
    tools=tools,
    max_tokens=500,
)

message = response.choices[0].message

# Kiểm tra tool calls
if message.tool_calls:
    for tool_call in message.tool_calls:
        print(f"Function: {tool_call.function.name}")
        print(f"Args: {tool_call.function.arguments}")
        
        # Gọi function thật
        result = call_your_function(tool_call.function.name, tool_call.function.arguments)
        
        # Gửi kết quả về AI
        messages.append(message)  # assistant message with tool_calls
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result),
        })
        
        # AI tổng hợp kết quả
        final = client.chat.completions.create(
            model="claude-sonnet-4.6",
            messages=messages,
            tools=tools,
            max_tokens=500,
        )
        print(final.choices[0].message.content)
```

---

## 16. Xử lý lỗi (Error Handling)

### Error codes

| HTTP Code | Ý nghĩa | Xử lý |
|-----------|----------|--------|
| `401` | API key không hợp lệ | Kiểm tra API key |
| `400` | Request không hợp lệ | Kiểm tra parameters |
| `422` | Validation error | Kiểm tra body format |
| `429` | Rate limit | Retry sau vài giây |
| `503` | Không có provider/key khả dụng | Liên hệ admin proxy |
| `504` | Timeout (mặc định 600s) | Giảm max_tokens hoặc tăng timeout |

### Python error handling

```python
from openai import OpenAI, APIError, APITimeoutError, RateLimitError

client = OpenAI(api_key=API_KEY, base_url=f"{PROXY_URL}/v1")

try:
    response = client.chat.completions.create(
        model="claude-sonnet-4.6",
        messages=[{"role": "user", "content": "Xin chào!"}],
        max_tokens=500,
    )
    print(response.choices[0].message.content)

except APITimeoutError:
    print("⏰ Request timeout — thử giảm max_tokens hoặc tăng timeout")

except RateLimitError:
    print("🚦 Rate limited — chờ và thử lại")
    import time
    time.sleep(5)

except APIError as e:
    print(f"❌ API Error {e.status_code}: {e.message}")

except Exception as e:
    print(f"💥 Unexpected: {e}")
```

### Retry pattern

```python
import time
from openai import OpenAI, APIError, APITimeoutError

def chat_with_retry(client, model, messages, max_retries=3, max_tokens=500):
    """Chat with automatic retry on transient errors."""
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except (APITimeoutError, APIError) as e:
            if attempt == max_retries - 1:
                raise
            wait = 2 ** attempt  # Exponential backoff
            print(f"Retry {attempt + 1}/{max_retries} in {wait}s...")
            time.sleep(wait)
```

---

## 17. Tích hợp Framework

### FastAPI

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import AsyncOpenAI

app = FastAPI()
ai_client = AsyncOpenAI(api_key=API_KEY, base_url=f"{PROXY_URL}/v1")

class ChatRequest(BaseModel):
    message: str
    model: str = "claude-sonnet-4.6"

class ChatResponse(BaseModel):
    reply: str
    tokens: int

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        response = await ai_client.chat.completions.create(
            model=req.model,
            messages=[{"role": "user", "content": req.message}],
            max_tokens=1000,
        )
        return ChatResponse(
            reply=response.choices[0].message.content,
            tokens=response.usage.total_tokens,
        )
    except Exception as e:
        raise HTTPException(500, f"AI error: {e}")
```

### FastAPI + Streaming (SSE)

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    async def generate():
        stream = await ai_client.chat.completions.create(
            model=req.model,
            messages=[{"role": "user", "content": req.message}],
            max_tokens=1000,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield f"data: {chunk.choices[0].delta.content}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### Flask

```python
from flask import Flask, request, jsonify
from openai import OpenAI

app = Flask(__name__)
ai_client = OpenAI(api_key=API_KEY, base_url=f"{PROXY_URL}/v1")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    response = ai_client.chat.completions.create(
        model=data.get("model", "claude-sonnet-4.6"),
        messages=[{"role": "user", "content": data["message"]}],
        max_tokens=1000,
    )
    return jsonify({"reply": response.choices[0].message.content})
```

### Django

```python
# views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from openai import OpenAI

ai_client = OpenAI(api_key=API_KEY, base_url=f"{PROXY_URL}/v1")

@csrf_exempt
def chat_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    
    data = json.loads(request.body)
    response = ai_client.chat.completions.create(
        model=data.get("model", "claude-sonnet-4.6"),
        messages=[{"role": "user", "content": data["message"]}],
        max_tokens=1000,
    )
    return JsonResponse({"reply": response.choices[0].message.content})
```

### Next.js (App Router)

```typescript
// app/api/chat/route.ts
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.PROXY_API_KEY!,
  baseURL: `${process.env.PROXY_URL}/v1`,
});

export async function POST(req: NextRequest) {
  const { message, model = "claude-sonnet-4.6" } = await req.json();

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: message }],
    max_tokens: 1000,
  });

  return NextResponse.json({
    reply: response.choices[0].message.content,
  });
}
```

### Next.js + Streaming

```typescript
// app/api/chat/route.ts
export async function POST(req: NextRequest) {
  const { message, model = "claude-sonnet-4.6" } = await req.json();

  const stream = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: message }],
    max_tokens: 1000,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          controller.enqueue(encoder.encode(content));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

### Express.js

```javascript
const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.PROXY_API_KEY,
  baseURL: `${process.env.PROXY_URL}/v1`,
});

app.post("/chat", async (req, res) => {
  const { message, model = "claude-sonnet-4.6" } = req.body;

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: message }],
    max_tokens: 1000,
  });

  res.json({ reply: response.choices[0].message.content });
});

app.listen(3000);
```

---

## 18. Migration từ API trực tiếp

### Từ OpenAI API → Proxy

```python
# TRƯỚC (gọi OpenAI trực tiếp)
client = OpenAI(api_key="sk-xxx")

# SAU (gọi qua proxy) — chỉ thêm base_url + đổi api_key
client = OpenAI(api_key=PROXY_API_KEY, base_url=f"{PROXY_URL}/v1")

# Code còn lại GIỮA NGUYÊN, không cần sửa gì!
response = client.chat.completions.create(
    model="gpt-5-mini",
    messages=[{"role": "user", "content": "Hello"}],
)
```

### Từ Anthropic API → Proxy

```python
# TRƯỚC (gọi Anthropic trực tiếp)
client = Anthropic(api_key="sk-ant-xxx")

# SAU (gọi qua proxy) — chỉ thêm base_url + đổi api_key
client = Anthropic(api_key=PROXY_API_KEY, base_url=PROXY_URL)

# Code còn lại GIỮA NGUYÊN!
response = client.messages.create(
    model="claude-sonnet-4.6",
    max_tokens=500,
    messages=[{"role": "user", "content": "Hello"}],
)
```

### Từ Google Gemini SDK → Proxy

Google Gemini SDK (`google.generativeai` / `google-genai`) **không hỗ trợ custom `base_url`**,
nên không thể dùng trực tiếp qua proxy. Cần chuyển sang OpenAI SDK:

```python
# TRƯỚC — Gọi Gemini trực tiếp bằng Google SDK
import google.generativeai as genai

genai.configure(api_key="AIza...")
model = genai.GenerativeModel("gemini-2.0-flash")
response = model.generate_content("Xin chào!")
print(response.text)

# SAU — Gọi Gemini qua proxy bằng OpenAI SDK
from openai import OpenAI

client = OpenAI(api_key=PROXY_API_KEY, base_url=f"{PROXY_URL}/v1")
response = client.chat.completions.create(
    model="gemini-3.1-pro-preview",
    messages=[{"role": "user", "content": "Xin chào!"}],
)
print(response.choices[0].message.content)
```

**So sánh nhanh:**

| Feature | Google Gemini SDK | OpenAI SDK qua Proxy |
|---------|-------------------|----------------------|
| Custom base_url | ❌ Không hỗ trợ | ✅ Có |
| Chat format | `model.generate_content(prompt)` | `client.chat.completions.create(messages=...)` |
| Streaming | `model.generate_content(prompt, stream=True)` | `stream=True` trong create() |
| System prompt | `model = GenerativeModel(system_instruction=...)` | `{"role": "system", "content": "..."}` |
| JSON mode | `generation_config={"response_mime_type": "application/json"}` | `response_format={"type": "json_object"}` |
| Multi-turn | `chat = model.start_chat(history=...)` | `messages=[{user}, {assistant}, ...]` |
| Tool calling | `tools=[...]` (Google format) | `tools=[...]` (OpenAI format) |

> 💡 **Bonus:** Khi dùng OpenAI SDK qua proxy, bạn có thể đổi model sang Claude/GPT
> mà không cần đổi code — chỉ thay `model="claude-sonnet-4.6"`.

### Từ OpenAI → Claude (đổi provider)

```python
# TRƯỚC — gọi GPT
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    max_tokens=500,
)

# SAU — gọi Claude, chỉ đổi model name!
response = client.chat.completions.create(
    model="claude-sonnet-4.6",   # ← Chỉ đổi dòng này
    messages=messages,
    max_tokens=500,
)
```

### Environment variables (khuyến nghị)

```bash
# .env
PROXY_URL=http://<proxy-host>:9000
PROXY_API_KEY=<your-api-key>
AI_MODEL=claude-sonnet-4.6
```

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("PROXY_API_KEY"),
    base_url=f"{os.getenv('PROXY_URL')}/v1",
)

response = client.chat.completions.create(
    model=os.getenv("AI_MODEL", "claude-sonnet-4.6"),
    messages=[{"role": "user", "content": "Hello"}],
    max_tokens=500,
)
```

---

## 19. Best Practices

### ✅ Nên làm

1. **Dùng OpenAI SDK** cho hầu hết app — compatible với tất cả models
2. **Dùng environment variables** cho URL, API key, model name
3. **Set `max_tokens`** phù hợp — tránh waste tokens
4. **Dùng streaming** cho UX tốt hơn (response hiện dần)
5. **Implement retry** với exponential backoff
6. **Dùng async client** trong async apps (FastAPI, async Python)
7. **Cache responses** khi có thể (cùng prompt → cùng kết quả)

### ❌ Không nên làm

1. **Không hard-code URL/API key** trong source code
2. **Không set timeout quá ngắn** — AI models cần thời gian suy nghĩ (khuyến nghị ≥ 60s)
3. **Không gửi quá nhiều messages** trong multi-turn — giữ context gọn (tóm tắt nếu cần)
4. **Không dùng `response_format`** cho Claude models — dùng prompt-based JSON thay thế (GPT/Gemini thì OK)
5. **Không mix SDK** — dùng 1 SDK nhất quán trong cùng 1 app

### 💡 Tips

```python
# Tip 1: Tạo shared client, reuse across requests
# ❌ Sai — tạo client mỗi request
def handle_request():
    client = OpenAI(api_key=KEY, base_url=URL)  # Tốn resource!
    return client.chat.completions.create(...)

# ✅ Đúng — tạo 1 lần, dùng nhiều lần
client = OpenAI(api_key=KEY, base_url=URL)
def handle_request():
    return client.chat.completions.create(...)
```

```python
# Tip 2: Dùng model parameter thay vì if/else
# ❌ Sai — logic phức tạp
if provider == "anthropic":
    anthropic_client.messages.create(...)
elif provider == "openai":
    openai_client.chat.completions.create(...)

# ✅ Đúng — proxy tự route
client.chat.completions.create(model=user_selected_model, ...)
```

---

## 20. Troubleshooting

### Lỗi phổ biến

| Lỗi | Nguyên nhân | Giải pháp |
|------|-------------|-----------|
| `Connection refused` | Proxy chưa chạy hoặc sai port | Kiểm tra proxy đang chạy ở đúng host:port |
| `401 Unauthorized` | API key sai | Kiểm tra API key từ dashboard |
| `503 All providers exhausted` | Tất cả provider keys đều lỗi | Kiểm tra dashboard, có thể keys hết quota |
| `504 Timeout` | Response quá lâu | Giảm max_tokens hoặc tăng timeout |
| `Empty response` | Model không trả content | Kiểm tra messages format, thử model khác |
| `JSONDecodeError` khi parse JSON | Model trả text thay vì JSON | Dùng prompt-based JSON approach ở mục 12 |

### Kiểm tra kết nối

```python
import httpx

def check_proxy(proxy_url: str, api_key: str) -> bool:
    """Kiểm tra proxy có hoạt động không."""
    try:
        r = httpx.get(
            f"{proxy_url}/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10,
        )
        if r.status_code == 200:
            models = r.json().get("data", [])
            print(f"✅ Proxy OK — {len(models)} models available")
            for m in models:
                print(f"   - {m['id']}")
            return True
        else:
            print(f"❌ Proxy error: HTTP {r.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect: {e}")
        return False

check_proxy("http://<proxy-host>:9000", "<api-key>")
```

### Debug request

```python
# Bật logging để xem chi tiết request/response
import logging
logging.basicConfig(level=logging.DEBUG)

# Hoặc dùng httpx verbose
import httpx
r = httpx.post(
    f"{PROXY_URL}/v1/chat/completions",
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json={"model": "claude-sonnet-4.6", "messages": [{"role": "user", "content": "test"}], "max_tokens": 10},
    timeout=30,
)
print(f"Status: {r.status_code}")
print(f"Body: {r.text[:500]}")
```

---

## Tóm tắt nhanh

```
┌─────────────────────────────────────────────────────────────┐
│                    CHEAT SHEET                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  URL:  http://<proxy-host>:9000                              │
│  Key:  Lấy từ dashboard proxy                                │
│                                                              │
│  OpenAI SDK:                                                 │
│    client = OpenAI(api_key=KEY, base_url=URL+"/v1")          │
│                                                              │
│  Anthropic SDK:                                              │
│    client = Anthropic(api_key=KEY, base_url=URL)             │
│                                                              │
│  Models: claude-sonnet-4.6, gpt-5-mini, gemini-3.1-pro...   │
│  GET /v1/models để lấy danh sách mới nhất                   │
│                                                              │
│  ✅ Streaming:       stream=True                             │
│  ✅ System prompt:   role="system" hoặc system=...           │
│  ✅ Multi-turn:      messages=[{user}, {assistant}, ...]     │
│  ✅ Tools:           tools=[{type: "function", ...}]         │
│  ✅ JSON output:     response_format (GPT/Gemini) hoặc      │
│                      prompt-based (tất cả) — xem mục 12     │
│  ✅ Gemini:          Dùng OpenAI SDK (không dùng Gemini SDK) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
