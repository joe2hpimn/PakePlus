// 全局变量
let isRecording = false;
let recognition = null;
let dashboardCards = [];
let chatHistory = [];
let workspaceScale = 1.0;

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成'); // 调试日志
    
    initializeApp();
    initializeChart();
    initializeSpeechRecognition();
    initializeQuickCards();
    initializeDashboard();
    initializeWorkspaceControls();
    autoResizeTextarea();
    initializeAgentWorkflow();
    
    // 改进事件绑定
    const clearBtn = document.getElementById('clearWorkspace');
    if (clearBtn) {
        console.log('找到清除按钮'); // 调试日志
        
        // 移除可能存在的旧事件监听器
        clearBtn.removeEventListener('click', clearWorkspace);
        
        // 添加新的事件监听器
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('清除按钮被点击'); // 调试日志
            clearWorkspace();
        });
    } else {
        console.error('未找到清除按钮');
    }
    
    // 初始化流量图表
    setTimeout(initializeTrafficChart, 100);
});

// 初始化应用
function initializeApp() {
    // 标签页切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    const contentAreas = document.querySelectorAll('.content-area');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // 更新标签状态
            tabBtns.forEach(tab => tab.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新内容显示
            contentAreas.forEach(area => area.classList.remove('active'));
            const targetArea = document.getElementById(tabId);
            if (targetArea) {
                targetArea.classList.add('active');
            }
            
            // 如果切换到仪表盘，刷新图表
            if (tabId === 'dashboard') {
                setTimeout(refreshDashboardCharts, 100);
            }
        });
    });
}

// 初始化快捷卡片
function initializeQuickCards() {
    const quickCards = document.querySelectorAll('.quick-card');
    quickCards.forEach(card => {
        card.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            let message = '';
            
            switch(action) {
                case 'sales-analysis':
                    message = '分析本月销售数据，重点关注热门产品和增长趋势，请生成可视化图表';
                    break;
                case 'competitor-analysis':
                    message = '生成竞品分析报告，包含价格策略和市场定位，需要对比图表';
                    break;
                case 'trend-prediction':
                    message = '预测下个月的销售趋势和库存需求，生成预测图表';
                    break;
                case 'ad-optimization':
                    message = '优化广告投放策略，提升ROI表现，生成ROI分析图表';
                    break;
                default:
                    message = this.querySelector('h4').textContent;
            }
            
            sendQuickMessage(message);
        });
    });
}

// 初始化仪表盘
function initializeDashboard() {
    // 从本地存储加载仪表盘配置
    const savedCards = localStorage.getItem('dashboardCards');
    if (savedCards) {
        dashboardCards = JSON.parse(savedCards);
    }
    
    // 初始化拖拽功能
    initializeDragAndDrop();
    
    // 初始化图表
    initializeDashboardCharts();
}

// 初始化仪表盘图表
function initializeDashboardCharts() {
    const salesTrendCtx = document.getElementById('salesTrendChart');
    if (salesTrendCtx) {
        new Chart(salesTrendCtx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                    label: '销售额 ($)',
                    data: [65000, 78000, 85000, 92000, 105000, 125000],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
}

// 初始化拖拽功能
function initializeDragAndDrop() {
    const dashboardGrid = document.getElementById('dashboardGrid');
    if (!dashboardGrid) return;
    
    // 使用简单的拖拽实现
    let draggedElement = null;
    
    dashboardGrid.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('dashboard-card')) {
            draggedElement = e.target;
            e.target.style.opacity = '0.5';
        }
    });
    
    dashboardGrid.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('dashboard-card')) {
            e.target.style.opacity = '1';
            draggedElement = null;
        }
    });
    
    dashboardGrid.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    dashboardGrid.addEventListener('drop', function(e) {
        e.preventDefault();
        if (draggedElement && e.target.classList.contains('dashboard-card')) {
            // 交换位置
            const afterElement = getDragAfterElement(dashboardGrid, e.clientY);
            if (afterElement == null) {
                dashboardGrid.appendChild(draggedElement);
            } else {
                dashboardGrid.insertBefore(draggedElement, afterElement);
            }
            saveDashboardLayout();
        }
    });
}

// 新增：初始化工作区控件
function initializeWorkspaceControls() {
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const workspaceSteps = document.getElementById('workspaceSteps');

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            workspaceScale = Math.min(1.5, workspaceScale + 0.1);
            workspaceSteps.style.transform = `scale(${workspaceScale})`;
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            workspaceScale = Math.max(0.5, workspaceScale - 0.1);
            workspaceSteps.style.transform = `scale(${workspaceScale})`;
        });
    }
}

// 发送消息（增强版）
function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // 保存到聊天历史
    chatHistory.push({
        type: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });
    
    // 清除欢迎界面
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) {
        welcomeSection.style.display = 'none';
    }
    
    // 添加用户消息
    addMessage(message, 'user');
    input.value = '';
    
    // 自动调整textarea高度
    input.style.height = 'auto';
    
    // 显示加载状态
    showLoading();
    
    // 模拟AI响应
    setTimeout(() => {
        hideLoading();
        const response = generateAIResponse(message);
        
        // 如果有工作流步骤，先显示简单消息，然后渲染工作流
        if (response.workspaceSteps) {
            // 先显示简单的处理中消息
            addMessage('🔄 正在为您进行深度分析，请查看左侧AI实时洞察区域...', 'bot');
            
            // 渲染工作区步骤
            renderWorkspace(response.workspaceSteps);
            
            // 计算工作流完成时间（每个步骤500ms延迟）
            const workflowDuration = response.workspaceSteps.length * 500 + 1000;
            
            // 工作流完成后显示详细报告
            setTimeout(() => {
                addMessage(response.content, 'bot');
                
                // 如果响应包含图表数据，添加到仪表盘
                if (response.chartData) {
                    addChartToDashboard(response.chartData);
                }
                
                // 保存到聊天历史
                chatHistory.push({
                    type: 'bot',
                    content: response.content,
                    timestamp: new Date().toISOString(),
                    chartData: response.chartData
                });
                
                // 保存聊天历史
                localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            }, workflowDuration);
        } else {
            // 没有工作流步骤，直接显示响应
            addMessage(response.content, 'bot');
            
            // 如果响应包含图表数据，添加到仪表盘
            if (response.chartData) {
                addChartToDashboard(response.chartData);
            }
            
            // 保存到聊天历史
            chatHistory.push({
                type: 'bot',
                content: response.content,
                timestamp: new Date().toISOString(),
                chartData: response.chartData
            });
            
            // 保存聊天历史
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        }
    }, 2000);
}

// 发送快捷消息
function sendQuickMessage(message) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = message;
        sendMessage();
    }
}

// 添加消息到聊天界面（增强版）
function addMessage(content, type) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    // 如果是bot消息且包含图表提示，添加保存按钮
    let saveButton = '';
    if (type === 'bot' && (content.includes('图表') || content.includes('分析') || content.includes('报告'))) {
        saveButton = `
            <div class="message-actions">
                <button class="btn-small" onclick="saveCurrentAnalysis()">
                    <i class="fas fa-save"></i>
                    保存到仪表盘
                </button>
            </div>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${avatar}
        </div>
        <div class="message-content">
            <p>${content.replace(/\n/g, '<br>')}</p>
            ${saveButton}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 重构渲染工作区函数
function renderWorkspace(steps) {
    const processContainer = document.getElementById('processContainer');
    const workspacePlaceholder = document.getElementById('workspacePlaceholder');
    const workspaceStatus = document.getElementById('workspaceStatus');
    const progressFooter = document.getElementById('progressFooter');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (!processContainer) return;
    
    // 隐藏占位符，显示进度条
    workspacePlaceholder.style.display = 'none';
    progressFooter.style.display = 'block';
    
    // 更新状态
    const statusText = workspaceStatus.querySelector('.status-text');
    const statusIndicator = workspaceStatus.querySelector('.status-indicator');
    statusText.textContent = '分析中';
    statusIndicator.className = 'status-indicator working';
    
    // 清空容器
    processContainer.innerHTML = '';
    
    steps.forEach((step, index) => {
        setTimeout(() => {
            // 创建流程卡片
            const card = document.createElement('div');
            card.className = 'process-card';
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon ${getIconType(step.text)}">
                        <i class="${step.icon}"></i>
                    </div>
                    <h4 class="card-title">${step.text}</h4>
                </div>
                <div class="card-content">
                    ${getStepDescription(step.text)}
                </div>
                <div class="card-status processing">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>处理中...</span>
                </div>
            `;
            
            processContainer.appendChild(card);
            
            // 显示动画
            setTimeout(() => {
                card.classList.add('visible', 'active');
            }, 100);
            
            // 更新进度
            const progress = ((index + 1) / steps.length) * 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = `分析进度: ${Math.round(progress)}%`;
            
            // 完成当前步骤
            setTimeout(() => {
                const status = card.querySelector('.card-status');
                const completedTime = new Date().toLocaleTimeString('zh-CN', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                
                status.className = 'card-status completed';
                status.innerHTML = '<i class="fas fa-check-circle"></i><span>已完成</span>';
                card.classList.remove('active');
                card.classList.add('completed');
                
                // 添加时间戳
                const timestamp = document.createElement('div');
                timestamp.className = 'card-timestamp';
                timestamp.textContent = `完成时间: ${completedTime}`;
                card.appendChild(timestamp);
                
                // 如果是最后一步
                if (index === steps.length - 1) {
                    setTimeout(() => {
                        statusText.textContent = '分析完成';
                        statusIndicator.className = 'status-indicator';
                        
                        // 只隐藏进度条，保留流程卡片
                        setTimeout(() => {
                            progressFooter.style.display = 'none';
                            // 保持状态为"分析完成"，不重置为"待机中"
                        }, 3000);
                    }, 500);
                }
            }, 1500);
            
        }, index * 800);
    });
}

// 优化清除功能
function clearWorkspace() {
    const processContainer = document.getElementById('processContainer');
    const workspacePlaceholder = document.getElementById('workspacePlaceholder');
    const workspaceStatus = document.getElementById('workspaceStatus');
    const progressFooter = document.getElementById('progressFooter');
    
    console.log('清除工作区'); // 调试日志
    
    // 清空容器
    if (processContainer) {
        processContainer.innerHTML = '';
    }
    
    // 显示占位符
    if (workspacePlaceholder) {
        workspacePlaceholder.style.display = 'flex';
    }
    
    // 隐藏进度条
    if (progressFooter) {
        progressFooter.style.display = 'none';
    }
    
    // 重置状态为"待机中"
    if (workspaceStatus) {
        const statusText = workspaceStatus.querySelector('.status-text');
        const statusIndicator = workspaceStatus.querySelector('.status-indicator');
        
        if (statusText) {
            statusText.textContent = '待机中';
        }
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator';
        }
    }
    
    // 强制重绘
    setTimeout(() => {
        if (workspaceStatus) {
            workspaceStatus.style.display = 'none';
            workspaceStatus.offsetHeight; // 触发重绘
            workspaceStatus.style.display = 'flex';
        }
    }, 10);
}

// 获取图标类型
function getIconType(text) {
    if (text.includes('数据库') || text.includes('查询')) return 'database';
    if (text.includes('分析') || text.includes('图表')) return 'chart';
    if (text.includes('爬虫') || text.includes('扫描')) return 'browser';
    return 'ai';
}

// 获取步骤描述
function getStepDescription(text) {
    const descriptions = {
        '正在连接销售数据库...': '建立安全连接，验证数据源完整性',
        '成功连接，开始查询本月数据...': '执行SQL查询，提取相关数据记录',
        '数据提取完成，共计 5,842 条记录。': '数据获取成功，准备进行预处理',
        '正在进行数据清洗和预处理...': '清理异常值，标准化数据格式',
        '数据处理完成，开始进行多维度分析...': '应用机器学习算法进行深度分析',
        '分析完成，正在生成核心洞察和可视化图表...': '生成图表和报告，提取关键洞察',
        '报告生成完毕。': '分析报告已生成，可在聊天区查看'
    };
    return descriptions[text] || 'AI正在处理您的请求...';
}

// 生成AI响应（增强版）
function generateAIResponse(message) {
    const responses = {
        '分析本月销售数据，重点关注热门产品和增长趋势，请生成可视化图表': {
            content: '📊 **本月销售深度分析报告**\n\n好的，正在为您分析销售数据...我已经完成了数据查询和初步处理，现在为您呈现核心洞察。',
            workspaceSteps: [
                { icon: 'fas fa-database', text: '正在连接销售数据库...' },
                { icon: 'fas fa-search-dollar', text: '成功连接，开始查询本月数据...' },
                { icon: 'fas fa-file-invoice-dollar', text: '数据提取完成，共计 5,842 条记录。' },
                { icon: 'fas fa-magic', text: '正在进行数据清洗和预处理...' },
                { icon: 'fas fa-cogs', text: '数据处理完成，开始进行多维度分析...' },
                { icon: 'fas fa-chart-pie', text: '分析完成，正在生成核心洞察和可视化图表...' },
                { icon: 'fas fa-check-circle', text: '报告生成完毕。' }
            ],
            chartData: {
                type: 'sales-trend',
                title: '销售趋势分析',
                data: {
                    labels: ['第1周', '第2周', '第3周', '第4周'],
                    datasets: [{
                        label: '销售额',
                        data: [28000, 32000, 35000, 30430],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)'
                    }]
                }
            }
        },
        
        '生成竞品分析报告，包含价格策略和市场定位，需要对比图表': {
            content: '🔍 **竞品策略深度分析报告**\n\n已完成对主要竞争对手的全面分析：\n\n**🏢 主要竞争对手**\n• 竞争对手A：价格激进型，低价抢市场\n• 竞争对手B：品质导向型，高端定位\n• 竞争对手C：营销驱动型，社交媒体强势\n\n**💰 价格策略对比**\n• 我们的定价比市场平均高8%\n• 在品质相同产品上，我们有15%价格优势\n• 建议调整3个SKU的定价以提升竞争力\n\n**📍 市场定位分析**\n• 我们在"性价比"维度领先\n• 在"品牌知名度"方面需要加强\n• 客户服务满意度排名第2\n\n**🎯 差异化机会**\n1. 强化售后服务优势\n2. 开发独家产品线\n3. 建立品牌社区\n\n📊 **竞品对比图表已生成，显示各维度的竞争优势，可保存到仪表盘。**',
            workspaceSteps: [
                { icon: 'fas fa-robot', text: '启动市场情报爬虫...' },
                { icon: 'fas fa-search', text: '正在扫描竞品A、B、C的公开数据...' },
                { icon: 'fas fa-file-alt', text: '数据采集完成，整合分析中...' },
                { icon: 'fas fa-lightbulb', text: '正在进行价格策略和市场定位建模...' },
                { icon: 'fas fa-chart-bar', text: '模型分析完成，生成对比报告...' },
                { icon: 'fas fa-check-circle', text: '报告生成完毕。' }
            ],
            chartData: {
                type: 'competitor-comparison',
                title: '竞品对比分析',
                data: {
                    labels: ['价格', '品质', '服务', '营销', '品牌'],
                    datasets: [{
                        label: '我们',
                        data: [7, 8, 9, 6, 6],
                        backgroundColor: 'rgba(99, 102, 241, 0.6)'
                    }, {
                        label: '竞争对手A',
                        data: [9, 6, 5, 7, 5],
                        backgroundColor: 'rgba(239, 68, 68, 0.6)'
                    }]
                }
            }
        }
    };
    
    // 检查是否有精确匹配的回复
    if (responses[message]) {
        return responses[message];
    }
    
    // 模糊匹配
    for (let key in responses) {
        if (message.includes('销售') && key.includes('销售')) {
            return responses[key];
        }
        if (message.includes('竞品') && key.includes('竞品')) {
            return responses[key];
        }
        if (message.includes('预测') && key.includes('预测')) {
            return {
                content: '🔮 **下月销售趋势预测报告**\n\n基于历史数据和市场指标分析：\n\n**📈 销售预测**\n• 预计销售额：$138,000 - $144,000\n• 增长率：8% - 15%\n• 订单量预测：1,320 - 1,420单\n\n📈 **预测图表已生成，可保存到仪表盘进行跟踪对比。**',
                chartData: {
                    type: 'sales-forecast',
                    title: '销售预测图',
                    data: {
                        labels: ['下周1', '下周2', '下周3', '下周4'],
                        datasets: [{
                            label: '预测销售额',
                            data: [34000, 36000, 38000, 36000],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderDash: [5, 5]
                        }]
                    }
                }
            };
        }
        if (message.includes('广告') && key.includes('广告')) {
            return {
                content: '🎯 **广告投放优化策略报告**\n\n当前广告表现分析及优化建议：\n\n**📊 当前表现**\n• 整体ROI：3.2（行业平均2.8）\n• 点击率：2.1%（+0.3% 环比）\n• 转化率：3.2%（+0.5% 环比）\n\n📊 **ROI分析图表已生成，可保存到仪表盘监控广告效果。**',
                chartData: {
                    type: 'roi-analysis',
                    title: 'ROI分析图',
                    data: {
                        labels: ['Google Ads', 'Facebook', 'Instagram', 'TikTok'],
                        datasets: [{
                            label: 'ROI',
                            data: [3.8, 2.9, 3.1, 2.6],
                            backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4']
                        }]
                    }
                }
            };
        }
    }
    
    // 默认回复
    return {
        content: '我理解您的需求。让我为您分析相关数据并生成专业的分析报告。基于当前的业务数据，我建议您关注以下几个关键指标的变化趋势，这将有助于优化您的运营策略。\n\n如果您需要更具体的分析，请告诉我您最关心的业务指标或问题。生成的图表和分析都可以保存到您的个人仪表盘。'
    };
}

// 添加图表到仪表盘
function addChartToDashboard(chartData) {
    if (!chartData) return;
    
    // 创建新的仪表盘卡片
    const cardId = 'chart-' + Date.now();
    const dashboardGrid = document.getElementById('dashboardGrid');
    const addCard = dashboardGrid.querySelector('.add-card');
    
    const newCard = document.createElement('div');
    newCard.className = 'dashboard-card chart-card';
    newCard.setAttribute('data-card-id', cardId);
    newCard.draggable = true;
    
    newCard.innerHTML = `
        <div class="card-header">
            <h3>${chartData.title}</h3>
            <div class="card-actions">
                <button class="card-action-btn" onclick="refreshCard('${cardId}')">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="card-action-btn" onclick="removeCard('${cardId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="chart-container">
            <canvas id="${cardId}-canvas"></canvas>
        </div>
        <div class="card-footer">
            <span class="card-source">来自AI对话</span>
            <span class="card-time">${new Date().toLocaleString()}</span>
        </div>
    `;
    
    // 插入到添加按钮之前
    dashboardGrid.insertBefore(newCard, addCard);
    
    // 初始化图表
    setTimeout(() => {
        const canvas = document.getElementById(cardId + '-canvas');
        if (canvas) {
            new Chart(canvas, {
                type: chartData.type === 'competitor-comparison' ? 'radar' : 'line',
                data: chartData.data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: chartData.type === 'competitor-comparison'
                        }
                    }
                }
            });
        }
    }, 100);
    
    // 保存到本地存储
    dashboardCards.push({
        id: cardId,
        type: chartData.type,
        title: chartData.title,
        data: chartData.data,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('dashboardCards', JSON.stringify(dashboardCards));
    
    // 显示提示
    showNotification('图表已添加到个人仪表盘！', 'success');
}

// 保存当前分析到仪表盘
function saveCurrentAnalysis() {
    // 获取最后一条bot消息的图表数据
    const lastBotMessage = chatHistory.filter(msg => msg.type === 'bot').pop();
    if (lastBotMessage && lastBotMessage.chartData) {
        addChartToDashboard(lastBotMessage.chartData);
    } else {
        showNotification('没有可保存的图表数据', 'warning');
    }
}

// 自定义仪表盘
function customizeDashboard() {
    showNotification('仪表盘自定义功能开发中...', 'info');
}

// 导出仪表盘
function exportDashboard() {
    const dashboardData = {
        cards: dashboardCards,
        exportTime: new Date().toISOString(),
        userInfo: {
            name: '张经理',
            company: 'Flymeo'
        }
    };
    
    const dataStr = JSON.stringify(dashboardData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `仪表盘数据_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('仪表盘数据已导出！', 'success');
}

// 显示添加图表模态框
function showAddCardModal() {
    const modal = document.getElementById('addCardModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// 关闭添加图表模态框
function closeAddCardModal() {
    const modal = document.getElementById('addCardModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 刷新仪表盘图表
function refreshDashboardCharts() {
    const charts = document.querySelectorAll('.dashboard-card canvas');
    charts.forEach(canvas => {
        const chart = Chart.getChart(canvas);
        if (chart) {
            chart.update();
        }
    });
}

// 移除卡片
function removeCard(cardId) {
    const card = document.querySelector(`[data-card-id="${cardId}"]`);
    if (card && confirm('确定要移除这个图表吗？')) {
        card.remove();
        dashboardCards = dashboardCards.filter(c => c.id !== cardId);
        localStorage.setItem('dashboardCards', JSON.stringify(dashboardCards));
        showNotification('图表已移除', 'success');
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation' : 'info'}-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 其他现有函数保持不变...
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'zh-CN';
        
        recognition.onstart = function() {
            isRecording = true;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.classList.add('recording');
            }
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = transcript;
                sendMessage();
            }
        };
        
        recognition.onend = function() {
            isRecording = false;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.classList.remove('recording');
            }
        };
        
        recognition.onerror = function(event) {
            console.error('语音识别错误:', event.error);
            isRecording = false;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.classList.remove('recording');
            }
        };
    }
}

function toggleVoiceInput() {
    if (!recognition) {
        alert('您的浏览器不支持语音识别功能');
        return;
    }
    
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResizeTextarea() {
    const textarea = document.getElementById('chatInput');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
        
        textarea.addEventListener('keypress', handleKeyPress);
    }
}

function generateReport() {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showNotification('新的分析报告正在生成中，预计3-5分钟完成。完成后将自动出现在报告列表中。', 'info');
    }, 2000);
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// 初始化图表（原有函数）
function initializeChart() {
    const ctx = document.getElementById('salesChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                    label: '销售额 ($)',
                    data: [65000, 78000, 85000, 92000, 105000, 125000],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
}

// 模拟数据更新
setInterval(() => {
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach(card => {
        const changeElement = card.querySelector('.metric-change');
        if (changeElement && Math.random() > 0.9) {
            const isPositive = Math.random() > 0.5;
            const change = (Math.random() * 5).toFixed(1);
            const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
            const className = isPositive ? 'positive' : 'negative';
            
            changeElement.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${isPositive ? '+' : '-'}${change}% 较上月</span>
            `;
            changeElement.className = `metric-change ${className}`;
        }
    });
}, 30000);

// 虚拟桌面管理
let openWindows = [];
let windowZIndex = 1000;

// 初始化虚拟桌面
function initializeVirtualDesktop() {
    updateTaskbarTime();
    setInterval(updateTaskbarTime, 1000);
}

// 更新任务栏时间
function updateTaskbarTime() {
    const timeElement = document.getElementById('taskbarTime');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// 创建桌面窗口
function createDesktopWindow(config) {
    const windowId = 'window-' + Date.now();
    const desktopWindows = document.getElementById('desktopWindows');
    
    const windowElement = document.createElement('div');
    windowElement.className = `desktop-window ${config.type || ''}`;
    windowElement.id = windowId;
    windowElement.style.left = (config.x || 50 + openWindows.length * 30) + 'px';
    windowElement.style.top = (config.y || 50 + openWindows.length * 30) + 'px';
    windowElement.style.width = (config.width || 400) + 'px';
    windowElement.style.height = (config.height || 300) + 'px';
    windowElement.style.zIndex = ++windowZIndex;
    
    windowElement.innerHTML = `
        <div class="window-header">
            <div class="window-controls">
                <div class="window-control close" onclick="closeWindow('${windowId}')"></div>
                <div class="window-control minimize"></div>
                <div class="window-control maximize"></div>
            </div>
            <div class="window-title">${config.title}</div>
        </div>
        <div class="window-content">
            ${config.content}
        </div>
    `;
    
    desktopWindows.appendChild(windowElement);
    
    // 添加到任务栏
    addToTaskbar(windowId, config.title, config.icon);
    
    // 显示动画
    setTimeout(() => {
        windowElement.classList.add('visible');
    }, 100);
    
    openWindows.push({
        id: windowId,
        title: config.title,
        element: windowElement
    });
    
    return windowId;
}

// 添加到任务栏
function addToTaskbar(windowId, title, icon) {
    const taskbarApps = document.getElementById('taskbarApps');
    const taskbarApp = document.createElement('div');
    taskbarApp.className = 'taskbar-app active';
    taskbarApp.id = 'taskbar-' + windowId;
    taskbarApp.innerHTML = `<i class="${icon || 'fas fa-window-maximize'}"></i>`;
    taskbarApp.title = title;
    taskbarApps.appendChild(taskbarApp);
}

// 关闭窗口
function closeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    const taskbarElement = document.getElementById('taskbar-' + windowId);
    
    if (windowElement) {
        windowElement.style.opacity = '0';
        windowElement.style.transform = 'scale(0.8)';
        setTimeout(() => {
            windowElement.remove();
        }, 300);
    }
    
    if (taskbarElement) {
        taskbarElement.remove();
    }
    
    openWindows = openWindows.filter(w => w.id !== windowId);
    
    // 如果没有打开的窗口，显示占位符
    if (openWindows.length === 0) {
        const placeholder = document.getElementById('workspacePlaceholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
    }
}

// Meo管家相关功能
function viewWorkflowDetails(workflowType) {
    console.log(`查看${workflowType}工作流详情`);
    // 这里可以打开详情模态框或跳转到详情页面
    alert(`正在查看${getWorkflowName(workflowType)}工作流详情`);
}

function executeWorkflow(workflowType) {
    console.log(`执行${workflowType}工作流`);
    // 这里可以启动相应的AI工作流
    alert(`正在启动${getWorkflowName(workflowType)}工作流...`);
    
    // 模拟工作流执行
    setTimeout(() => {
        alert(`${getWorkflowName(workflowType)}工作流执行完成！`);
    }, 2000);
}

function getWorkflowName(workflowType) {
    const names = {
        'inventory': '库存管理',
        'listing': '商品上架',
        'advertising': '广告投放',
        'keywords': '关键词分析'
    };
    return names[workflowType] || workflowType;
}

function createNewWorkflow() {
    alert('正在打开工作流创建向导...');
    // 这里可以打开工作流创建界面
}

function viewAllReports() {
    // 切换到报告中心
    const reportsTab = document.querySelector('[data-tab="reports"]');
    if (reportsTab) {
        reportsTab.click();
    }
}

function configureAgents() {
    alert('正在打开AI Agent配置界面...');
    // 这里可以打开Agent配置界面
}

function exportWorkflowData() {
    alert('正在导出工作流数据...');
    // 这里可以实现数据导出功能
}

// Meo管家左侧工作管理功能
function refreshWorkTasks() {
    console.log('刷新工作任务');
    // 模拟刷新动画
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    icon.classList.add('fa-spin');
    
    setTimeout(() => {
        icon.classList.remove('fa-spin');
        alert('工作任务已刷新！');
    }, 1000);
}

function createNewTask() {
    alert('正在打开新建任务界面...');
    // 这里可以打开任务创建模态框
}

function handleUrgentTask(taskId) {
    console.log(`处理紧急任务: ${taskId}`);
    alert('正在处理紧急任务，AI助手将协助您完成...');
}

function applySuggestion(suggestionId) {
    console.log(`采纳AI建议: ${suggestionId}`);
    alert('AI建议已采纳，正在自动执行相关操作...');
}

// Meo管家右侧流量攻防功能
function refreshTrafficData() {
    console.log('刷新流量数据');
    const btn = event.target.closest('button');
    const icon = btn.querySelector('i');
    icon.classList.add('fa-spin');
    
    setTimeout(() => {
        icon.classList.remove('fa-spin');
        alert('流量数据已刷新！');
    }, 1000);
}

function openTrafficStrategy() {
    alert('正在打开流量策略配置界面...');
}

function handleCriticalAlert(alertId) {
    console.log(`处理严重警报: ${alertId}`);
    alert('正在启动反击策略，AI将自动处理跟卖问题...');
}

function viewAlertDetails(alertId) {
    console.log(`查看警报详情: ${alertId}`);
    alert('正在打开警报详情页面...');
}

function optimizeAds(productType) {
    console.log(`优化广告: ${productType}`);
    alert(`正在为${productType}优化广告策略...`);
}

function analyzeAdPerformance(productType) {
    console.log(`分析广告表现: ${productType}`);
    alert(`正在分析${productType}的广告表现...`);
}

function reinforceKeyword(keyword) {
    console.log(`加强关键词: ${keyword}`);
    alert(`正在加强关键词"${keyword}"的优化...`);
}

function pauseStrategy(strategyId) {
    console.log(`暂停策略: ${strategyId}`);
    alert('策略已暂停');
}

function configStrategy(strategyId) {
    console.log(`配置策略: ${strategyId}`);
    alert('正在打开策略配置界面...');
}

function launchStrategy(strategyId) {
    console.log(`启动策略: ${strategyId}`);
    alert('策略已启动，AI将开始执行...');
}

function previewStrategy(strategyId) {
    console.log(`预览策略: ${strategyId}`);
    alert('正在生成策略预览...');
}

function runNowStrategy(strategyId) {
    console.log(`立即执行策略: ${strategyId}`);
    alert('策略正在执行中...');
}

function editSchedule(strategyId) {
    console.log(`编辑计划: ${strategyId}`);
    alert('正在打开计划编辑界面...');
}

// 初始化流量趋势图表
function initializeTrafficChart() {
    const ctx = document.getElementById('trafficTrendChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: '流量',
                    data: [1200, 800, 1500, 2100, 1800, 1600],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                }
            }
        });
    }
}

// 在初始化函数中添加桌面初始化
function initializeApp() {
    // 标签页切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    const contentAreas = document.querySelectorAll('.content-area');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // 更新标签状态
            tabBtns.forEach(tab => tab.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新内容显示
            contentAreas.forEach(area => area.classList.remove('active'));
            const targetArea = document.getElementById(tabId);
            if (targetArea) {
                targetArea.classList.add('active');
            }
            
            // 如果切换到仪表盘，刷新图表
            if (tabId === 'dashboard') {
                setTimeout(refreshDashboardCharts, 100);
            }
        });
    });
    
    initializeVirtualDesktop();
}

// 智能体工作规划相关函数
function refreshAgentPlan() {
    showNotification('正在刷新智能体工作规划...', 'info');
    // 模拟刷新过程
    setTimeout(() => {
        showNotification('智能体工作规划已更新', 'success');
        // 这里可以添加实际的刷新逻辑
    }, 1500);
}

function customizeAgentPlan() {
    showNotification('智能体规划自定义功能开发中...', 'info');
    // 这里可以添加自定义配置的逻辑
}

function viewStepDetails(stepType) {
    const stepNames = {
        'patrol': '关键信息巡查',
        'analysis': '核心数据分析', 
        'strategy': '攻防策略制定',
        'report': '运营日志生成'
    };
    
    showNotification(`查看${stepNames[stepType]}详情...`, 'info');
    // 这里可以添加查看详情的逻辑
}

// 智能体工作规划相关函数
function refreshAgentPlan() {
    showNotification('正在刷新智能体工作规划...', 'info');
    // 模拟刷新过程
    setTimeout(() => {
        showNotification('智能体工作规划已更新', 'success');
        // 这里可以添加实际的刷新逻辑
    }, 1500);
}

function customizeAgentPlan() {
    showNotification('智能体规划自定义功能开发中...', 'info');
    // 这里可以添加自定义配置的逻辑
}

function viewStepDetails(stepType) {
    const stepNames = {
        'patrol': '关键信息巡查',
        'analysis': '核心数据分析', 
        'strategy': '攻防策略制定',
        'report': '运营日志生成'
    };
    
    showNotification(`查看${stepNames[stepType]}详情...`, 'info');
    // 这里可以添加查看详情的逻辑
}

// 初始化智能体工作流程
function initializeAgentWorkflow() {
    // 模拟工作流程状态更新
    setTimeout(() => {
        const inProgressStep = document.querySelector('.workflow-step.in-progress .progress-fill');
        if (inProgressStep) {
            let currentWidth = 65;
            const interval = setInterval(() => {
                currentWidth += 1;
                inProgressStep.style.width = currentWidth + '%';
                inProgressStep.parentElement.nextElementSibling.textContent = currentWidth + '%';
                
                if (currentWidth >= 100) {
                    clearInterval(interval);
                    // 可以在这里添加步骤完成的逻辑
                }
            }, 2000);
        }
    }, 3000);
}