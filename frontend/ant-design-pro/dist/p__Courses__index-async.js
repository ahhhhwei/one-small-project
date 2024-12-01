((typeof globalThis !== 'undefined' ? globalThis : self)["makoChunk_ant-design-pro"] = (typeof globalThis !== 'undefined' ? globalThis : self)["makoChunk_ant-design-pro"] || []).push([
        ['p__Courses__index'],
{ "src/pages/Courses/index.tsx": function (module, exports, __mako_require__){
"use strict";
__mako_require__.d(exports, "__esModule", {
    value: true
});
__mako_require__.d(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
var _interop_require_wildcard = __mako_require__("@swc/helpers/_/_interop_require_wildcard");
var _reactrefresh = /*#__PURE__*/ _interop_require_wildcard._(__mako_require__("node_modules/react-refresh/runtime.js"));
var _jsxdevruntime = __mako_require__("node_modules/react/jsx-dev-runtime.js");
var _react = /*#__PURE__*/ _interop_require_wildcard._(__mako_require__("node_modules/react/index.js"));
var _ahooks = __mako_require__("node_modules/ahooks/es/index.js");
var _antd = __mako_require__("node_modules/antd/es/index.js");
var _icons = __mako_require__("node_modules/@ant-design/icons/es/index.js");
var prevRefreshReg;
var prevRefreshSig;
prevRefreshReg = self.$RefreshReg$;
prevRefreshSig = self.$RefreshSig$;
self.$RefreshReg$ = (type, id)=>{
    _reactrefresh.register(type, module.id + id);
};
self.$RefreshSig$ = _reactrefresh.createSignatureFunctionForTransform;
var _s = $RefreshSig$();
const CourseManagement = ()=>{
    _s();
    const [courses, setCourses] = (0, _react.useState)([]);
    const [isModalVisible, setIsModalVisible] = (0, _react.useState)(false);
    const [editingCourse, setEditingCourse] = (0, _react.useState)(null);
    const [form] = _antd.Form.useForm();
    const [studentModalVisible, setStudentModalVisible] = (0, _react.useState)(false);
    const [selectedCourse, setSelectedCourse] = (0, _react.useState)(null);
    const [students, setStudents] = (0, _react.useState)([]);
    const [studentCounts, setStudentCounts] = (0, _react.useState)({});
    // 使用 useRequest 获取课程数据
    const { data, loading, error } = (0, _ahooks.useRequest)(async ()=>{
        const response = await fetch('http://localhost:8080/api/courses');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        console.log('@', jsonData);
        console.log('Raw data from server:', jsonData);
        return jsonData.data.map((course)=>({
                ...course,
                key: course.courseId
            }));
    }, {
        onSuccess: (transformedData)=>{
            setCourses(transformedData);
        },
        onError: (err)=>{
            console.error('Error fetching courses:', err);
        }
    });
    // 每次页面打开时获取所有课程的学生信息
    (0, _react.useEffect)(()=>{
        const fetchAllStudentCounts = async ()=>{
            const counts = {};
            await Promise.all(courses.map(async (course)=>{
                try {
                    const response = await fetch(`http://localhost:8080/api/course_students/${course.courseId}`);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const jsonData = await response.json();
                    const studentCount = jsonData.data.length;
                    counts[course.courseId] = studentCount;
                } catch (error) {
                    console.error(`Error fetching students for course ${course.courseId}:`, error);
                    counts[course.courseId] = 0; // 如果获取失败，默认为0
                }
            }));
            setStudentCounts(counts);
        };
        if (courses.length > 0) fetchAllStudentCounts();
    }, [
        courses
    ]);
    if (loading) return /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)("p", {
        children: "Loading..."
    }, void 0, false, {
        fileName: "src/pages/Courses/index.tsx",
        lineNumber: 83,
        columnNumber: 23
    }, this);
    if (error) return /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)("p", {
        children: [
            "Error: ",
            error.message
        ]
    }, void 0, true, {
        fileName: "src/pages/Courses/index.tsx",
        lineNumber: 84,
        columnNumber: 21
    }, this);
    const showModal = (course)=>{
        if (course) {
            setEditingCourse(course);
            form.setFieldsValue(course);
        } else {
            setEditingCourse(null);
            form.resetFields();
        }
        setIsModalVisible(true);
    };
    const handleOk = async ()=>{
        try {
            const values = await form.validateFields();
            if (editingCourse) // 编辑现有课程
            setCourses(courses.map((course)=>course.key === editingCourse.key ? {
                    ...values,
                    key: course.key
                } : course));
            else {
                // 添加新课程
                const newCourse = {
                    ...values,
                    key: Date.now().toString()
                };
                setCourses([
                    ...courses,
                    newCourse
                ]);
            }
            setIsModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };
    const handleDelete = (key)=>{
        _antd.Modal.confirm({
            title: '确认删除',
            content: '确定要删除这门课程吗？',
            onOk: ()=>{
                setCourses(courses.filter((course)=>course.key !== key));
            }
        });
    };
    const showStudents = async (course)=>{
        try {
            const response = await fetch(`http://localhost:8080/api/course_students/${course.courseId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const jsonData = await response.json();
            const fetchedStudents = jsonData.data;
            setStudents(fetchedStudents);
            setSelectedCourse(course);
            setStudentModalVisible(true);
        } catch (error) {
            _antd.message.error('获取学生信息失败，请稍后再试');
            console.error('Error fetching students:', error);
        }
    };
    const studentColumns = [
        {
            title: '学号',
            dataIndex: 'Sno',
            key: 'Sno',
            sorter: (a, b)=>a.Sno.localeCompare(b.Sno)
        },
        {
            title: '姓名',
            dataIndex: 'Sname',
            key: 'Sname',
            sorter: (a, b)=>a.Sname.localeCompare(b.Sname)
        },
        {
            title: '成绩',
            dataIndex: 'Grade',
            key: 'Grade',
            sorter: (a, b)=>a.Grade - b.Grade
        }
    ];
    const columns = [
        {
            title: '课程号',
            dataIndex: 'courseId',
            key: 'courseId',
            sorter: (a, b)=>a.courseId.localeCompare(b.courseId)
        },
        {
            title: '课程名',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b)=>a.name.localeCompare(b.name)
        },
        {
            title: '开课学院',
            dataIndex: 'college',
            key: 'college',
            filters: Array.from(new Set(courses.map((c)=>c.college))).map((college)=>({
                    text: college,
                    value: college
                })),
            onFilter: (value, record)=>record.college === value
        },
        {
            title: '任课教师',
            dataIndex: 'teacher',
            key: 'teacher'
        },
        {
            title: '选课人数',
            key: 'studentCount',
            render: (_, record)=>/*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Tag, {
                    color: "blue",
                    children: [
                        studentCounts[record.courseId],
                        " 人"
                    ]
                }, void 0, true, {
                    fileName: "src/pages/Courses/index.tsx",
                    lineNumber: 203,
                    columnNumber: 9
                }, this),
            sorter: (a, b)=>studentCounts[a.courseId] - studentCounts[b.courseId]
        },
        {
            title: '学分',
            dataIndex: 'credits',
            key: 'credits',
            sorter: (a, b)=>a.credits - b.credits
        },
        {
            title: '上课教室',
            dataIndex: 'classroom',
            key: 'classroom'
        },
        {
            title: '开课学期',
            dataIndex: 'date',
            key: 'date',
            filters: Array.from(new Set(courses.map((c)=>c.date))).map((date)=>({
                    text: date,
                    value: date
                })),
            onFilter: (value, record)=>record.date === value
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record)=>/*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Space, {
                    children: [
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Button, {
                            type: "link",
                            icon: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_icons.TeamOutlined, {}, void 0, false, {
                                fileName: "src/pages/Courses/index.tsx",
                                lineNumber: 237,
                                columnNumber: 19
                            }, void 0),
                            onClick: ()=>showStudents(record),
                            children: "查看学生"
                        }, void 0, false, {
                            fileName: "src/pages/Courses/index.tsx",
                            lineNumber: 235,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Button, {
                            type: "link",
                            icon: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_icons.EditOutlined, {}, void 0, false, {
                                fileName: "src/pages/Courses/index.tsx",
                                lineNumber: 244,
                                columnNumber: 19
                            }, void 0),
                            onClick: ()=>showModal(record),
                            children: "编辑"
                        }, void 0, false, {
                            fileName: "src/pages/Courses/index.tsx",
                            lineNumber: 242,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Button, {
                            type: "link",
                            danger: true,
                            icon: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_icons.DeleteOutlined, {}, void 0, false, {
                                fileName: "src/pages/Courses/index.tsx",
                                lineNumber: 252,
                                columnNumber: 19
                            }, void 0),
                            onClick: ()=>handleDelete(record.key),
                            children: "删除"
                        }, void 0, false, {
                            fileName: "src/pages/Courses/index.tsx",
                            lineNumber: 249,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "src/pages/Courses/index.tsx",
                    lineNumber: 234,
                    columnNumber: 9
                }, this)
        }
    ];
    return /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)("div", {
        style: {
            padding: 24
        },
        children: [
            /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Card, {
                title: "课程信息管理",
                extra: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Button, {
                    type: "primary",
                    icon: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_icons.PlusOutlined, {}, void 0, false, {
                        fileName: "src/pages/Courses/index.tsx",
                        lineNumber: 269,
                        columnNumber: 19
                    }, void 0),
                    onClick: ()=>showModal(),
                    children: "添加课程"
                }, void 0, false, {
                    fileName: "src/pages/Courses/index.tsx",
                    lineNumber: 267,
                    columnNumber: 11
                }, void 0),
                children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Table, {
                    columns: columns,
                    dataSource: courses,
                    pagination: {
                        pageSize: 10,
                        showTotal: (total)=>`共 ${total} 条记录`
                    }
                }, void 0, false, {
                    fileName: "src/pages/Courses/index.tsx",
                    lineNumber: 276,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "src/pages/Courses/index.tsx",
                lineNumber: 264,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Modal, {
                title: editingCourse ? "编辑课程信息" : "添加课程",
                open: isModalVisible,
                onOk: handleOk,
                onCancel: ()=>{
                    setIsModalVisible(false);
                    form.resetFields();
                },
                width: 720,
                children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form, {
                    form: form,
                    layout: "vertical",
                    initialValues: editingCourse || {},
                    children: [
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "courseId",
                            label: "课程号",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入课程号'
                                },
                                {
                                    pattern: /^[A-Za-z0-9]+$/,
                                    message: '课程号只能包含字母和数字'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                placeholder: "请输入课程号",
                                disabled: !!editingCourse
                            }, void 0, false, {
                                fileName: "src/pages/Courses/index.tsx",
                                lineNumber: 309,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/Courses/index.tsx",
                            lineNumber: 301,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "name",
                            label: "课程名",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入课程名'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                placeholder: "请输入课程名"
                            }, void 0, false, {
                                fileName: "src/pages/Courses/index.tsx",
                                lineNumber: 320,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/Courses/index.tsx",
                            lineNumber: 315,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "college",
                            label: "开课学院",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入开课学院'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                placeholder: "请输入开课学院"
                            }, void 0, false, {
                                fileName: "src/pages/Courses/index.tsx",
                                lineNumber: 328,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/Courses/index.tsx",
                            lineNumber: 323,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "teacher",
                            label: "任课教师",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入任课教师'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                placeholder: "请输入任课教师"
                            }, void 0, false, {
                                fileName: "src/pages/Courses/index.tsx",
                                lineNumber: 336,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/Courses/index.tsx",
                            lineNumber: 331,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "credits",
                            label: "学分",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入学分'
                                },
                                {
                                    type: 'number',
                                    min: 0.5,
                                    max: 10,
                                    message: '学分必须在0.5到10之间'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.InputNumber, {
                                min: 0.5,
                                max: 10,
                                step: 0.5,
                                placeholder: "请输入学分",
                                style: {
                                    width: '100%'
                                }
                            }, void 0, false, {
                                fileName: "src/pages/Courses/index.tsx",
                                lineNumber: 347,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/Courses/index.tsx",
                            lineNumber: 339,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "classroom",
                            label: "上课教室",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入上课教室'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                placeholder: "请输入上课教室"
                            }, void 0, false, {
                                fileName: "src/pages/Courses/index.tsx",
                                lineNumber: 361,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/Courses/index.tsx",
                            lineNumber: 356,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "src/pages/Courses/index.tsx",
                    lineNumber: 296,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "src/pages/Courses/index.tsx",
                lineNumber: 286,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Modal, {
                title: `${selectedCourse === null || selectedCourse === void 0 ? void 0 : selectedCourse.name} - 学生名单`,
                open: studentModalVisible,
                onOk: ()=>setStudentModalVisible(false),
                onCancel: ()=>setStudentModalVisible(false),
                width: 720,
                children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Table, {
                    columns: studentColumns,
                    dataSource: students,
                    pagination: false
                }, void 0, false, {
                    fileName: "src/pages/Courses/index.tsx",
                    lineNumber: 373,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "src/pages/Courses/index.tsx",
                lineNumber: 366,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "src/pages/Courses/index.tsx",
        lineNumber: 263,
        columnNumber: 5
    }, this);
};
_s(CourseManagement, "XTKSspDN1vR7rUQUMEqctYrJeZA=", false, function() {
    return [
        _antd.Form.useForm,
        _ahooks.useRequest
    ];
});
_c = CourseManagement;
var _default = CourseManagement;
var _c;
$RefreshReg$(_c, "CourseManagement");
if (prevRefreshReg) self.$RefreshReg$ = prevRefreshReg;
if (prevRefreshSig) self.$RefreshSig$ = prevRefreshSig;
function registerClassComponent(filename, moduleExports) {
    for(const key in moduleExports)try {
        if (key === "__esModule") continue;
        const exportValue = moduleExports[key];
        if (_reactrefresh.isLikelyComponentType(exportValue) && exportValue.prototype && exportValue.prototype.isReactComponent) _reactrefresh.register(exportValue, filename + " " + key);
    } catch (e) {}
}
function $RefreshIsReactComponentLike$(moduleExports) {
    if (_reactrefresh.isLikelyComponentType(moduleExports || moduleExports.default)) return true;
    for(var key in moduleExports)try {
        if (_reactrefresh.isLikelyComponentType(moduleExports[key])) return true;
    } catch (e) {}
    return false;
}
registerClassComponent(module.id, module.exports);
if ($RefreshIsReactComponentLike$(module.exports)) {
    module.meta.hot.accept();
    _reactrefresh.performReactRefresh();
}

},
 }]);
//# sourceMappingURL=p__Courses__index-async.js.map