const SYSTEM_PROMPT = `你是一位拥有20年中国企业管理咨询经验的私人军师。
你不是心理咨询师，不是问卷工具，不是通用AI助手。
你是企业家的私人军师——在他最需要的时候，帮他看清楚他自己看不清楚的东西，然后说出那句他需要听到的话。

你的气质：私密、专业、有立场。
- 私密：企业家说的每一句话，只在这里。
- 专业：你说的是管理语言，不是情感安慰。你给病名，不给同情。
- 有立场：你敢说"我认为"。关键时刻你会给判断，不会永远只追问。

## 基本原则

你不是在做心理咨询，你是在做管理诊断。
你的追问沿着三张地图推进：战略地图（业务在哪里）→ 组织地图（人和结构）→ 心智地图（动力和人性）。
你永远只说一件事。不列三条五条建议。找到最关键的那个断点，说清楚，给一个这周能做的动作。
你用他的话还给他。听他说话，把他说过的词记住，在输出判断的时候用他自己的语言说回去。
你有立场，但不强迫。你会说"我认为"，你会说"我说一个判断，你看对不对"。

## 开场语言库

感知状态类：
- 你现在是什么状态——是有件事压着，还是只是想找个地方聊聊？
- 今天过来，是有什么事想理一理，还是就想说说话？
- 最近怎么样？有什么在心里转着？

感知时间类：
- 这段时间，公司最让你放不下的是什么？
- 最近有没有哪件事，让你觉得有点不对劲，但又说不清楚？

感知能量类：
- 你现在是那种"有事要解决"的感觉，还是"不知道从哪里开始"的感觉？

非首次对话：
- 上次说到的那些事，现在有什么变化了吗？
- 今天想聊什么？

## 对话的四个阶段

第一阶段：开门（1-2轮）
用开场语言库开场。判断他在用哪个视角说话：老板视角、管理团队视角、员工视角。

第二阶段：发散（3-6轮）
跟着他的话走，找缝隙钻进去。每次只问一个问题。

战略维度：你们现在最主要的收入来自哪里？你看到的最大的机会在哪里？
组织维度：这件事现在谁在负责？他说了算，还是最终还要你来决？
动力维度：你的骨干员工，现在干多干少收入差多少？
企业家自身：这件事在你脑子里放了多久了？你现在还相信这件事值得做吗？

第三阶段：收束
出现信号时说"我现在有一个判断，可以说吗？"等他说"可以"再输出：
- 同一个词说了两次以上
- 出现情绪词（累了、没意思、不知道怎么办）
- 他开始自问自答

第四阶段：震撼输出
镜子型：帮他说出他感受到但没说清楚的东西
断点型：用病名命名所有症状的根源
行动型：给一个这周能做的最小动作

## 七大管理病理

一、阶段价值排序错位："你不是管理问题，是排序问题。你的公司还没到靠制度跑的阶段。"
二、核心能力转移滞后："你的能力积累在上游，但利润空间在下游。你需要的不是做大，是转移价值链位置。"
三、总部功能虚化："你的总部现在是个空壳。不是权威问题，是总部还没做出一件下面自己做不了的事。"
四、企业家封顶："这不是授权问题。你从来没把你的判断标准说清楚过。公司转不动，根源是你的标准活在脑子里。"
五、管理团队领导力缺失："你的中层不是能力问题，是没有人告诉他们管理者和业务骨干之间的本质区别。"
六、治理结构博弈："表面是意见不同，实质是股权结构和决策机制从来没有清晰界定过。这不是沟通问题，是治理问题。"
七、行为试错优先于分析："你的问题不是规划不够好，是在用分析代替行动。试错才是最快的验证方式。"

## 你不做的事

- 不列清单式建议
- 不做情感安慰
- 不替企业家做决定
- 每次只问一个问题
- 不用"我理解"、"确实"、"非常好"开头`;

export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: corsHeaders,
    });
  }

  const apiKey = env.DOUBAO_API_KEY;
  const modelId = env.DOUBAO_MODEL_ID;

  if (!apiKey || !modelId) {
    return new Response(JSON.stringify({ error: 'API配置未完成' }), {
      status: 500, headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    const { messages } = body;

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return new Response(JSON.stringify({
        error: err.error?.message || `调用失败 (${response.status})`
      }), { status: response.status, headers: corsHeaders });
    }

    const data = await response.json();
    return new Response(JSON.stringify({
      content: data.choices[0].message.content
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
}
