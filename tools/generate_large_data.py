#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为 one-small-project 生成高真实性合成高校选课数据。

课程池来自用户提供的成绩表，仅使用课程相关字段：
- 课程名称
- 学分
- 开课学院
- 任课教师
- 课程类别
- 考核方式

学生姓名、手机号、地址、成绩均为程序生成的合成数据，
仅保证格式和统计分布尽量接近真实情况，不代表真实个人。

默认规模：
  1,000 名学生
  78 个课程实例
  每名学生 18~30 门课
  约 2.4 万条选课记录

所有 SQL 面向 ShardingSphere 逻辑库 wenjw_db，
不要直接导入物理库 wenjw_db0 / wenjw_db1。
"""

import argparse
import math
import random
from pathlib import Path

COURSES = [
    {
        "name": "大学物理实验  A",
        "credit": 1.5,
        "dept": "物理学院",
        "teacher": "吴彬",
        "category": "学科基础课",
        "assessment": "考查"
    },
    {
        "name": "大学物理Ⅰ",
        "credit": 3.0,
        "dept": "物理学院",
        "teacher": "施建青",
        "category": "大类基础课程",
        "assessment": "考试"
    },
    {
        "name": "数字图像处理",
        "credit": 2.0,
        "dept": "计算机科学与技术学院",
        "teacher": "刘盛",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "思想政治理论课社会实践",
        "credit": 2.0,
        "dept": "马克思主义学院",
        "teacher": "无",
        "category": "实践教学环节",
        "assessment": ""
    },
    {
        "name": "体质健康训练Ⅲ",
        "credit": 0.25,
        "dept": "体军部",
        "teacher": "王润",
        "category": "据专业计划调整",
        "assessment": ""
    },
    {
        "name": "体质健康训练Ⅳ",
        "credit": 0.25,
        "dept": "体军部",
        "teacher": "潘华峰",
        "category": "据专业计划调整",
        "assessment": ""
    },
    {
        "name": "中国近现代史纲要",
        "credit": 2.0,
        "dept": "马克思主义学院",
        "teacher": "颜桂珍",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "马克思主义基本原理",
        "credit": 3.0,
        "dept": "马克思主义学院",
        "teacher": "李叶",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "体育",
        "credit": 1.0,
        "dept": "体军部",
        "teacher": "罗华敏",
        "category": "通识课程",
        "assessment": ""
    },
    {
        "name": "体育",
        "credit": 1.0,
        "dept": "体军部",
        "teacher": "唐文兵",
        "category": "通识课程",
        "assessment": ""
    },
    {
        "name": "体育",
        "credit": 1.0,
        "dept": "体军部",
        "teacher": "蔡国军",
        "category": "通识课程",
        "assessment": ""
    },
    {
        "name": "体育",
        "credit": 1.0,
        "dept": "体军部",
        "teacher": "渠扬",
        "category": "通识课程",
        "assessment": ""
    },
    {
        "name": "算法分析与设计",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "燕锐",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "Java程序设计",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "徐利锋",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "C++程序设计",
        "credit": 4.0,
        "dept": "计算机科学与技术学院",
        "teacher": "姜娓娓",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "数据结构",
        "credit": 4.0,
        "dept": "计算机科学与技术学院",
        "teacher": "蒋莉",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "国际数学建模英语论文写作提高班（双语）",
        "credit": 2.0,
        "dept": "数学科学学院",
        "teacher": "宋军全",
        "category": "通识课程",
        "assessment": ""
    },
    {
        "name": "党的建设理论",
        "credit": 1.0,
        "dept": "组织部",
        "teacher": "黄琼",
        "category": "据专业计划调整",
        "assessment": ""
    },
    {
        "name": "计算机视觉",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "刘盛",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "知识产权导论",
        "credit": 2.0,
        "dept": "法学院",
        "teacher": "刘松珍",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "操作系统课程设计",
        "credit": 1.0,
        "dept": "计算机科学与技术学院",
        "teacher": "夏列钢",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "中医药文化与养生",
        "credit": 2.0,
        "dept": "药学院",
        "teacher": "杜理华",
        "category": "通识课程",
        "assessment": ""
    },
    {
        "name": "金融危机启示录",
        "credit": 2.0,
        "dept": "法学院",
        "teacher": "刘天姿",
        "category": "据专业计划调整",
        "assessment": ""
    },
    {
        "name": "大学物理ⅡB",
        "credit": 2.5,
        "dept": "物理学院",
        "teacher": "陈乃波",
        "category": "13",
        "assessment": "考试"
    },
    {
        "name": "证券投资分析",
        "credit": 2.0,
        "dept": "经济学院",
        "teacher": "王健",
        "category": "通识课程",
        "assessment": "考查"
    },
    {
        "name": "工程经济",
        "credit": 2.0,
        "dept": "管理学院",
        "teacher": "刘道学",
        "category": "通识课程",
        "assessment": "考试"
    },
    {
        "name": "传统文化的审美之旅",
        "credit": 2.0,
        "dept": "人文学院",
        "teacher": "陆红颖",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "C++程序设计课程设计",
        "credit": 1.0,
        "dept": "计算机科学与技术学院",
        "teacher": "姜娓娓",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "数据结构课程设计",
        "credit": 1.0,
        "dept": "计算机科学与技术学院",
        "teacher": "蒋莉",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "计算机组成课程设计",
        "credit": 1.0,
        "dept": "计算机科学与技术学院",
        "teacher": "范玉雷",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "数据库系统课程设计",
        "credit": 1.0,
        "dept": "计算机科学与技术学院",
        "teacher": "杨良怀",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "数据库原理及应用",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "杨良怀",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "信息安全基础",
        "credit": 2.0,
        "dept": "计算机科学与技术学院",
        "teacher": "朱添田",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "程序设计基础C",
        "credit": 4.0,
        "dept": "计算机科学与技术学院",
        "teacher": "蒋莉",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "大学英语",
        "credit": 4.0,
        "dept": "外国语学院",
        "teacher": "郑秀华",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "通用学术英语",
        "credit": 4.0,
        "dept": "外国语学院",
        "teacher": "刘百军",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "计算机组成原理",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "范玉雷",
        "category": "大类基础课程",
        "assessment": "考试"
    },
    {
        "name": "离散数学",
        "credit": 4.0,
        "dept": "计算机科学与技术学院",
        "teacher": "杨海平",
        "category": "大类基础课程",
        "assessment": "考试"
    },
    {
        "name": "专业导论",
        "credit": 1.0,
        "dept": "计算机科学与技术学院",
        "teacher": "杨良怀",
        "category": "通识课程",
        "assessment": "考查"
    },
    {
        "name": "操作系统原理",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "夏列钢",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "数学建模",
        "credit": 3.0,
        "dept": "数学科学学院",
        "teacher": "周凯",
        "category": "学科基础课",
        "assessment": "考查"
    },
    {
        "name": "大学信息技术基础",
        "credit": 1.0,
        "dept": "计算机科学与技术学院",
        "teacher": "李强",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "高等数学Ⅱ",
        "credit": 6.0,
        "dept": "数学科学学院",
        "teacher": "程善",
        "category": "大类基础课程",
        "assessment": "考试"
    },
    {
        "name": "计算机网络原理",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "杨旭华",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "大数据计算框架",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "胡海根",
        "category": "专业课程",
        "assessment": "考试"
    },
    {
        "name": "分布式数据库系统",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "范玉雷",
        "category": "专业课程",
        "assessment": "考试"
    },
    {
        "name": "人工智能及其应用",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "高楠",
        "category": "专业课程",
        "assessment": "考试"
    },
    {
        "name": "社交网络与舆情分析",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "温震宇;伍一鸣;宣琦",
        "category": "13",
        "assessment": "考查"
    },
    {
        "name": "文本分析与挖掘",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "梅建萍",
        "category": "专业方向课",
        "assessment": "考查"
    },
    {
        "name": "区块链技术",
        "credit": 2.0,
        "dept": "计算机科学与技术学院",
        "teacher": "程宏兵",
        "category": "13",
        "assessment": "考查"
    },
    {
        "name": "最优化方法",
        "credit": 3.0,
        "dept": "数学科学学院",
        "teacher": "曾燎原;丁晓东",
        "category": "专业方向课",
        "assessment": "考查"
    },
    {
        "name": "时间序列分析",
        "credit": 3.0,
        "dept": "数学科学学院",
        "teacher": "原俊青",
        "category": "专业方向课",
        "assessment": "考查"
    },
    {
        "name": "电影动漫与经典音乐赏析",
        "credit": 2.0,
        "dept": "设计与建筑学院",
        "teacher": "谷倩",
        "category": "通识课程",
        "assessment": ""
    },
    {
        "name": "线性代数B",
        "credit": 2.0,
        "dept": "数学科学学院",
        "teacher": "顾娟如",
        "category": "学科基础课",
        "assessment": "考试"
    },
    {
        "name": "概率论与数理统计A",
        "credit": 3.0,
        "dept": "数学科学学院",
        "teacher": "蒋丹华",
        "category": "学科基础课",
        "assessment": "考试"
    },
    {
        "name": "心理健康与自我成长",
        "credit": 1.0,
        "dept": "教育学院",
        "teacher": "李敏",
        "category": "通识课程",
        "assessment": "考试"
    },
    {
        "name": "国家安全教育",
        "credit": 1.0,
        "dept": "公共管理学院",
        "teacher": "顾容;肖云泽;闫丹;蒋惠琴;梁美赟",
        "category": "13",
        "assessment": "考查"
    },
    {
        "name": "心理健康教育实践",
        "credit": 1.0,
        "dept": "教育学院",
        "teacher": "李敏;王慧",
        "category": "实践教学环节",
        "assessment": "考查"
    },
    {
        "name": "“四史”教育",
        "credit": 1.0,
        "dept": "马克思主义学院",
        "teacher": "徐吉洪",
        "category": "通识课程",
        "assessment": "考查"
    },
    {
        "name": "思想道德与法治",
        "credit": 3.0,
        "dept": "马克思主义学院",
        "teacher": "林洁;郑华均",
        "category": "13",
        "assessment": "考试"
    },
    {
        "name": "文献检索与论文写作",
        "credit": 1.0,
        "dept": "计算机科学与技术学院",
        "teacher": "范玉雷",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "数据挖掘",
        "credit": 2.0,
        "dept": "计算机科学与技术学院",
        "teacher": "梅建萍",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "Python程序设计",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "毛家发",
        "category": "据专业计划调整",
        "assessment": "考试"
    },
    {
        "name": "多元统计分析课程设计",
        "credit": 1.0,
        "dept": "数学科学学院",
        "teacher": "王理同",
        "category": "13",
        "assessment": "考查"
    },
    {
        "name": "数学建模课程设计",
        "credit": 1.0,
        "dept": "数学科学学院",
        "teacher": "宋军全",
        "category": "13",
        "assessment": "考查"
    },
    {
        "name": "量化策略开发与程序化交易课程设计",
        "credit": 1.0,
        "dept": "数学科学学院",
        "teacher": "刘震",
        "category": "实践教学环节",
        "assessment": "考查"
    },
    {
        "name": "金融数据挖掘课程设计",
        "credit": 1.0,
        "dept": "数学科学学院",
        "teacher": "冯缘",
        "category": "实践教学环节",
        "assessment": "考查"
    },
    {
        "name": "统计软件课程设计",
        "credit": 1.0,
        "dept": "数学科学学院",
        "teacher": "王理同",
        "category": "实践教学环节",
        "assessment": "考查"
    },
    {
        "name": "多元统计分析",
        "credit": 3.0,
        "dept": "数学科学学院",
        "teacher": "王理同",
        "category": "13",
        "assessment": "考试"
    },
    {
        "name": "机器学习",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "黄亮",
        "category": "据专业计划调整",
        "assessment": "考查"
    },
    {
        "name": "深度神经网络",
        "credit": 3.0,
        "dept": "计算机科学与技术学院",
        "teacher": "管秋",
        "category": "13",
        "assessment": "考查"
    },
    {
        "name": "信息安全CTF入门",
        "credit": 2.0,
        "dept": "计算机科学与技术学院",
        "teacher": "黄重水",
        "category": "通识课程",
        "assessment": "考查"
    },
    {
        "name": "团队协作与职业素质",
        "credit": 2.0,
        "dept": "计算机科学与技术学院",
        "teacher": "张苗苗;韩姝盈;杨禹",
        "category": "13",
        "assessment": "考查"
    },
    {
        "name": "军事理论",
        "credit": 2.0,
        "dept": "体军部",
        "teacher": "刘长春",
        "category": "通识课程",
        "assessment": "考查"
    },
    {
        "name": "军事技能",
        "credit": 1.0,
        "dept": "体军部",
        "teacher": "方国清",
        "category": "实践教学环节",
        "assessment": "考查"
    },
    {
        "name": "毛泽东思想和中国特色社会主义理论体系概论",
        "credit": 2.0,
        "dept": "马克思主义学院",
        "teacher": "徐凤阳",
        "category": "13",
        "assessment": "考试"
    },
    {
        "name": "习近平新时代中国特色社会主义思想概论",
        "credit": 2.0,
        "dept": "马克思主义学院",
        "teacher": "徐凤阳",
        "category": "13",
        "assessment": "考试"
    },
    {
        "name": "高等数学Ⅰ",
        "credit": 5.0,
        "dept": "数学科学学院",
        "teacher": "程善",
        "category": "大类基础课程",
        "assessment": "考试"
    }
]

# 常见姓氏。使用权重数组让头部姓氏出现得更频繁。
SURNAMES = [
    "王","李","张","刘","陈","杨","黄","赵","吴","周",
    "徐","孙","马","朱","胡","郭","何","高","林","罗",
    "郑","梁","谢","宋","唐","许","韩","冯","邓","曹",
    "彭","曾","肖","田","董","袁","潘","于","蒋","蔡",
    "余","杜","叶","程","苏","魏","吕","丁","任","沈",
    "姚","卢","姜","崔","钟","谭","陆","汪","范","金",
    "石","廖","贾","夏","韦","傅","方","白","邹","孟",
]
SURNAME_WEIGHTS = [
    8.0,7.8,7.3,5.5,5.0,4.5,3.8,3.5,3.2,3.1,
    2.9,2.7,2.6,2.5,2.4,2.3,2.2,2.1,2.0,1.9,
    1.8,1.7,1.6,1.6,1.5,1.5,1.4,1.4,1.4,1.3,
    1.3,1.2,1.2,1.2,1.1,1.1,1.1,1.0,1.0,1.0,
    1.0,0.9,0.9,0.9,0.9,0.8,0.8,0.8,0.8,0.8,
    0.7,0.7,0.7,0.7,0.7,0.6,0.6,0.6,0.6,0.6,
    0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,
]

MALE_GIVEN = [
    "浩然","宇轩","子轩","俊杰","嘉豪","文博","明轩","一鸣","天宇","泽宇",
    "博文","子豪","俊宇","思远","嘉伟","浩宇","皓轩","志远","景程","奕辰",
    "昊然","睿泽","承宇","柏宇","亦航","彦博","梓轩","凯文","晨阳","修远",
    "子墨","嘉诚","昱辰","彦辰","铭泽","俊熙","致远","浩铭","泽楷","宇航",
    "景然","弘毅","嘉树","星宇","皓宇","书恒","启航","正阳","哲瀚","冠宇",
]
FEMALE_GIVEN = [
    "欣怡","雨桐","梓涵","思琪","佳怡","若曦","欣悦","诗涵","梦瑶","语彤",
    "可欣","雨欣","佳宁","子涵","雅婷","思妍","依诺","婉婷","诗琪","嘉怡",
    "晨曦","心怡","若涵","雅雯","欣妍","静怡","雨晴","思涵","佳琪","梦琪",
    "语嫣","书瑶","婉清","安琪","乐瑶","清妍","嘉宁","芷晴","思雨","可馨",
    "瑾萱","诗雅","雅琪","欣然","梦涵","雨菲","若彤","佳慧","晓彤","文静",
]

STUDENT_DEPTS = [
    ("计算机科学与技术学院", 40),
    ("数学科学学院", 12),
    ("电子信息学院", 10),
    ("管理学院", 8),
    ("经济学院", 6),
    ("物理学院", 5),
    ("法学院", 4),
    ("人文学院", 4),
    ("设计与建筑学院", 3),
    ("公共管理学院", 3),
    ("外国语学院", 3),
    ("教育学院", 2),
]

REGIONS = [
    ("安徽省","合肥市","230000"),
    ("安徽省","芜湖市","241000"),
    ("江苏省","南京市","210000"),
    ("江苏省","苏州市","215000"),
    ("浙江省","杭州市","310000"),
    ("浙江省","宁波市","315000"),
    ("山东省","济南市","250000"),
    ("山东省","青岛市","266000"),
    ("河南省","郑州市","450000"),
    ("湖北省","武汉市","430000"),
    ("湖南省","长沙市","410000"),
    ("广东省","广州市","510000"),
    ("广东省","深圳市","518000"),
    ("四川省","成都市","610000"),
    ("重庆市","重庆市","400000"),
    ("北京市","北京市","100000"),
    ("上海市","上海市","200000"),
    ("福建省","福州市","350000"),
    ("江西省","南昌市","330000"),
    ("山西省","太原市","030000"),
    ("河北省","石家庄市","050000"),
    ("辽宁省","沈阳市","110000"),
    ("吉林省","长春市","130000"),
    ("黑龙江省","哈尔滨市","150000"),
    ("陕西省","西安市","710000"),
    ("广西壮族自治区","南宁市","530000"),
    ("云南省","昆明市","650000"),
    ("贵州省","贵阳市","550000"),
]

# 形式上符合常见中国大陆手机号结构，但数据为合成数据。
MOBILE_PREFIXES = [
    "130","131","132","133","135","136","137","138","139",
    "150","151","152","155","156","157","158","159",
    "166","170","171","172","173","175","176","177","178",
    "180","181","182","183","185","186","187","188","189",
    "191","193","195","198","199",
]

GENERAL_DEPTS = {
    "马克思主义学院", "体军部", "外国语学院", "教育学院",
    "公共管理学院", "人文学院", "法学院", "组织部", "药学院"
}

BUILDINGS_BY_DEPT = {
    "计算机科学与技术学院": ["翡翠科教楼", "综合楼", "计算机楼"],
    "数学科学学院": ["翡翠科教楼", "健行楼"],
    "物理学院": ["翡翠科教楼", "实验楼"],
    "马克思主义学院": ["综合楼", "西二教学楼"],
    "体军部": ["体育馆", "东操场"],
    "外国语学院": ["西二教学楼", "综合楼"],
}
DEFAULT_BUILDINGS = ["健行楼", "广知楼", "郁文楼", "综合楼", "新教楼"]

SEMESTER_HINTS = {
    "高等数学Ⅰ": "大一上",
    "程序设计基础C": "大一上",
    "思想道德与法治": "大一上",
    "军事理论": "大一上",
    "军事技能": "大一上",
    "大学信息技术基础": "大一上",
    "高等数学Ⅱ": "大一下",
    "大学物理Ⅰ": "大一下",
    "线性代数B": "大一下",
    "C++程序设计": "大一下",
    "Java程序设计": "大一下",
    "离散数学": "大一下",
    "数据结构": "大二上",
    "概率论与数理统计A": "大二上",
    "计算机组成原理": "大二上",
    "数据库原理及应用": "大二下",
    "操作系统原理": "大二下",
    "计算机网络原理": "大二下",
    "算法分析与设计": "大二下",
    "数字图像处理": "大三上",
    "计算机视觉": "大三上",
    "大数据计算框架": "大三上",
    "分布式数据库系统": "大三上",
    "人工智能及其应用": "大三上",
    "机器学习": "大三下",
    "深度神经网络": "大三下",
    "数据挖掘": "大三下",
    "区块链技术": "大三下",
    "文本分析与挖掘": "大三下",
    "时间序列分析": "大三下",
    "最优化方法": "大三下",
}


def sql_quote(value):
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value).replace("\\", "\\\\").replace("'", "''")
    return "'" + s + "'"


def write_insert(fp, table, columns, rows):
    if not rows:
        return
    fp.write(f"INSERT INTO {table} ({', '.join(columns)}) VALUES\n")
    for idx, row in enumerate(rows):
        suffix = ",\n" if idx < len(rows) - 1 else ";\n"
        fp.write("(" + ",".join(sql_quote(v) for v in row) + ")" + suffix)


def choose_weighted(items, weights, rng):
    return rng.choices(items, weights=weights, k=1)[0]


def generate_name(sex, rng):
    surname = rng.choices(SURNAMES, weights=SURNAME_WEIGHTS, k=1)[0]
    given = rng.choice(MALE_GIVEN if sex == "男" else FEMALE_GIVEN)
    return surname + given


def generate_phone(i, rng):
    # suffix 使用置换式序列，保证在默认规模下基本不重复。
    prefix = MOBILE_PREFIXES[i % len(MOBILE_PREFIXES)]
    suffix = (17_392_481 + i * 7_919) % 100_000_000
    return prefix + f"{suffix:08d}"


def choose_student_dept(rng):
    names = [x[0] for x in STUDENT_DEPTS]
    weights = [x[1] for x in STUDENT_DEPTS]
    return rng.choices(names, weights=weights, k=1)[0]


def course_semester(course, idx):
    name = course["name"]
    if name in SEMESTER_HINTS:
        return SEMESTER_HINTS[name]
    if "课程设计" in name:
        if "数据结构" in name or "C++" in name or "计算机组成" in name:
            return "大二上"
        return "大三下"
    if "体育" in name or "体质健康" in name:
        return ["大一上","大一下","大二上","大二下"][idx % 4]
    if course["category"] in ("通识课程", "实践教学环节"):
        return ["大一上","大一下","大二上","大二下","大三上","大三下"][idx % 6]
    return ["大二上","大二下","大三上","大三下"][idx % 4]


def course_building(course, idx):
    choices = BUILDINGS_BY_DEPT.get(course["dept"], DEFAULT_BUILDINGS)
    return choices[idx % len(choices)]


def build_course_rows():
    rows = []
    for idx, course in enumerate(COURSES):
        cno = 12001 + idx
        rows.append((
            cno,
            course["name"],
            course["dept"],
            course["teacher"] if course["teacher"] != "无" else "待定",
            course_semester(course, idx),
            round(float(course["credit"]), 2),
            course_building(course, idx),
        ))
    return rows


def course_weight(course, student_dept):
    # 通识课/基础课覆盖面更广；本学院课程权重显著提高。
    weight = 1.0
    if course["dept"] == student_dept:
        weight *= 5.0
    elif course["dept"] in GENERAL_DEPTS:
        weight *= 2.7
    elif course["category"] in ("通识课程", "大类基础课程", "学科基础课"):
        weight *= 2.0

    # 计算机课程对非计算机学生仍具有一定热门度。
    if course["dept"] == "计算机科学与技术学院":
        weight *= 1.35

    name = course["name"]
    if name in {
        "Python程序设计", "C++程序设计", "人工智能及其应用",
        "机器学习", "数据库原理及应用", "数据结构"
    }:
        weight *= 1.8
    return weight


def weighted_sample_without_replacement(courses, student_dept, k, rng):
    scored = []
    for idx, course in enumerate(courses):
        w = max(course_weight(course, student_dept), 0.01)
        # Efraimidis-Spirakis weighted sampling
        key = rng.random() ** (1.0 / w)
        scored.append((key, idx))
    scored.sort(reverse=True)
    return [idx for _, idx in scored[:k]]


def course_difficulty_map(rng):
    result = {}
    for idx, course in enumerate(COURSES):
        name = course["name"]
        base = rng.gauss(0, 3.0)
        if any(x in name for x in ["高等数学", "算法", "操作系统", "计算机组成", "最优化", "概率论"]):
            base -= 3.0
        if "实践" in name or "课程设计" in name or course["assessment"] == "考查":
            base += 3.0
        result[idx] = base
    return result


def generate(args):
    rng = random.Random(args.seed)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)

    dept_names = [x[0] for x in STUDENT_DEPTS]
    difficulties = course_difficulty_map(rng)

    with out.open("w", encoding="utf-8", newline="\n") as fp:
        fp.write("-- Synthetic university dataset for one-small-project\n")
        fp.write("-- Import through ShardingSphere-Proxy :3307\n")
        fp.write("USE wenjw_db;\n\n")

        # Courses
        course_rows = build_course_rows()
        write_insert(
            fp, "wenjw_cou",
            ["cno","cname","cdept","ctea","cdate","cscore","caddr"],
            course_rows,
        )
        fp.write("\n")

        # Students
        student_batch = []
        students_meta = []
        for i in range(args.students):
            sno = args.student_base + i
            sex = "男" if rng.random() < 0.515 else "女"
            name = generate_name(sex, rng)
            dept = choose_student_dept(rng)
            province, city, post = rng.choice(REGIONS)
            age = int(round(rng.triangular(18, 25, 21)))
            phone = generate_phone(i, rng)
            addr = province + city

            student_batch.append((
                sno, name, dept, phone, sex, age, addr, post
            ))

            # latent ability makes a student's grades correlated across courses
            ability = max(58.0, min(94.0, rng.gauss(78.5, 7.5)))
            course_count = int(round(rng.triangular(
                args.min_courses, args.max_courses, args.mode_courses
            )))
            students_meta.append((sno, dept, ability, course_count))

            if len(student_batch) >= args.batch_size:
                write_insert(
                    fp, "wenjw_stu",
                    ["sno","sname","sdept","stel","sex","sage","saddr","spost"],
                    student_batch,
                )
                student_batch.clear()

        write_insert(
            fp, "wenjw_stu",
            ["sno","sname","sdept","stel","sex","sage","saddr","spost"],
            student_batch,
        )
        fp.write("\n")

        # Enrollments
        sc_batch = []
        enrollment_count = 0

        for sno, dept, ability, k in students_meta:
            k = min(k, len(COURSES))
            selected = weighted_sample_without_replacement(COURSES, dept, k, rng)

            for course_idx in selected:
                # 学生能力 + 课程难度 + 单门随机波动
                grade = ability + difficulties[course_idx] + rng.gauss(0, 6.5)

                # 极少数明显低分 / 满分，使尾部更像真实成绩。
                p = rng.random()
                if p < 0.008:
                    grade -= rng.uniform(15, 30)
                elif p > 0.997:
                    grade = 100.0

                grade = round(max(0.0, min(100.0, grade)), 1)
                cno = 12001 + course_idx
                sc_batch.append((sno, cno, grade))
                enrollment_count += 1

                if len(sc_batch) >= args.batch_size:
                    write_insert(
                        fp, "wenjw_sc",
                        ["sno","cno","grade"],
                        sc_batch,
                    )
                    sc_batch.clear()

        write_insert(
            fp, "wenjw_sc",
            ["sno","cno","grade"],
            sc_batch,
        )

    print(f"Generated: {out}")
    print(f"Students: {args.students:,}")
    print(f"Course offerings: {len(COURSES):,}")
    print(f"Enrollments: {enrollment_count:,}")
    print(f"Seed: {args.seed}")


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--students", type=int, default=1_000, help="学生数量（默认: 1000）")
    p.add_argument("--student-base", type=int, default=20_000_001)
    p.add_argument("--min-courses", type=int, default=18)
    p.add_argument("--max-courses", type=int, default=30)
    p.add_argument("--mode-courses", type=int, default=24)
    p.add_argument("--batch-size", type=int, default=500)
    p.add_argument("--seed", type=int, default=20260831)
    p.add_argument("--output", default="/tmp/wenjw_realistic.sql")
    return p.parse_args()


if __name__ == "__main__":
    generate(parse_args())
