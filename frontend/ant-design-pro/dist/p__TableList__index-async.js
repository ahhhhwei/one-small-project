((typeof globalThis !== 'undefined' ? globalThis : self)["makoChunk_ant-design-pro"] = (typeof globalThis !== 'undefined' ? globalThis : self)["makoChunk_ant-design-pro"] || []).push([
        ['p__TableList__index'],
{ "src/pages/TableList/index.tsx": function (module, exports, __mako_require__){
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
const StudentManagement = ()=>{
    _s();
    const [students, setStudents] = (0, _react.useState)([]);
    const [isModalVisible, setIsModalVisible] = (0, _react.useState)(false);
    const [editingStudent, setEditingStudent] = (0, _react.useState)(null);
    const [form] = _antd.Form.useForm();
    const [gradeModalVisible, setGradeModalVisible] = (0, _react.useState)(false);
    const [selectedStudent, setSelectedStudent] = (0, _react.useState)(null);
    const [grades, setGrades] = (0, _react.useState)([]);
    // 使用 useRequest 获取学生数据
    const { data, loading, error } = (0, _ahooks.useRequest)(async ()=>{
        const response = await fetch('http://localhost:8080/api/students');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        return jsonData.data.map((student)=>({
                ...student,
                key: student.studentId
            }));
    }, {
        onSuccess: (transformedData)=>{
            setStudents(transformedData);
        },
        onError: (err)=>{
            console.error('Error fetching students:', err);
            _antd.message.error('获取学生信息失败，请稍后再试！');
        }
    });
    if (loading) return /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)("p", {
        children: "Loading..."
    }, void 0, false, {
        fileName: "src/pages/TableList/index.tsx",
        lineNumber: 54,
        columnNumber: 23
    }, this);
    if (error) return /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)("p", {
        children: [
            "Error: ",
            error.message
        ]
    }, void 0, true, {
        fileName: "src/pages/TableList/index.tsx",
        lineNumber: 55,
        columnNumber: 21
    }, this);
    const showModal = (student)=>{
        if (student) {
            setEditingStudent(student);
            form.setFieldsValue(student);
        } else {
            setEditingStudent(null);
            form.resetFields();
        }
        setIsModalVisible(true);
    };
    const showGrade = async (student)=>{
        try {
            const response = await fetch(`http://127.0.0.1:8080/api/student_courses/${student.studentId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const jsonData = await response.json();
            setGrades(jsonData.data);
            setSelectedStudent(student);
            setGradeModalVisible(true);
        } catch (error) {
            _antd.message.error('获取学生成绩失败，请稍后再试');
            console.error('Error fetching grades:', error);
        }
    };
    const handleOk = async ()=>{
        try {
            const values = await form.validateFields();
            if (editingStudent) // 编辑现有学生
            setStudents(students.map((student)=>student.key === editingStudent.key ? {
                    ...values,
                    key: student.key
                } : student));
            else {
                // 添加新学生
                const newStudent = {
                    ...values,
                    key: Date.now().toString()
                };
                setStudents([
                    ...students,
                    newStudent
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
            content: '确定要删除这条学生信息吗？',
            onOk: ()=>{
                setStudents(students.filter((student)=>student.key !== key));
            }
        });
    };
    const columns = [
        {
            title: '学号',
            dataIndex: 'studentId',
            key: 'studentId',
            sorter: (a, b)=>a.studentId.localeCompare(b.studentId)
        },
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: '学院',
            dataIndex: 'college',
            key: 'college',
            filters: Array.from(new Set(students.map((s)=>s.college))).map((college)=>({
                    text: college,
                    value: college
                })),
            onFilter: (value, record)=>record.college === value
        },
        {
            title: '性别',
            dataIndex: 'Sex',
            key: 'Sex'
        },
        {
            title: '年龄',
            dataIndex: 'age',
            key: 'age',
            sorter: (a, b)=>a.age - b.age
        },
        {
            title: '电话',
            dataIndex: 'phone',
            key: 'phone'
        },
        {
            title: '地址',
            dataIndex: 'address',
            key: 'address'
        },
        {
            title: '邮编',
            dataIndex: 'zipCode',
            key: 'zipCode'
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record)=>/*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Space, {
                    children: [
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Button, {
                            type: "link",
                            icon: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_icons.EditOutlined, {}, void 0, false, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 174,
                                columnNumber: 19
                            }, void 0),
                            onClick: ()=>showModal(record),
                            children: "编辑"
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 172,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Button, {
                            type: "link",
                            icon: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_icons.EditOutlined, {}, void 0, false, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 181,
                                columnNumber: 19
                            }, void 0),
                            onClick: ()=>showGrade(record),
                            children: "学生成绩"
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 179,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Button, {
                            type: "link",
                            danger: true,
                            icon: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_icons.DeleteOutlined, {}, void 0, false, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 189,
                                columnNumber: 19
                            }, void 0),
                            onClick: ()=>handleDelete(record.key),
                            children: "删除"
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 186,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "src/pages/TableList/index.tsx",
                    lineNumber: 171,
                    columnNumber: 9
                }, this)
        }
    ];
    const gradeColumns = [
        {
            title: '课程名',
            dataIndex: 'Cname',
            key: 'Cname',
            sorter: (a, b)=>a.Cname.localeCompare(b.Cname)
        },
        {
            title: '成绩',
            dataIndex: 'Grade',
            key: 'Grade',
            render: (text, record)=>{
                return /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)("span", {
                    style: {
                        color: record.Grade < 60 ? 'red' : 'inherit'
                    },
                    children: record.Grade
                }, void 0, false, {
                    fileName: "src/pages/TableList/index.tsx",
                    lineNumber: 211,
                    columnNumber: 18
                }, this);
            },
            sorter: (a, b)=>a.Grade - b.Grade
        }
    ];
    return /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)("div", {
        style: {
            padding: 24
        },
        children: [
            /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Card, {
                title: "学生信息管理",
                extra: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Button, {
                    type: "primary",
                    icon: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_icons.PlusOutlined, {}, void 0, false, {
                        fileName: "src/pages/TableList/index.tsx",
                        lineNumber: 222,
                        columnNumber: 17
                    }, void 0),
                    onClick: ()=>showModal(),
                    children: "添加学生"
                }, void 0, false, {
                    fileName: "src/pages/TableList/index.tsx",
                    lineNumber: 220,
                    columnNumber: 9
                }, void 0),
                children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Table, {
                    columns: columns,
                    dataSource: students,
                    pagination: {
                        pageSize: 10,
                        showTotal: (total)=>`共 ${total} 条记录`
                    }
                }, void 0, false, {
                    fileName: "src/pages/TableList/index.tsx",
                    lineNumber: 228,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "src/pages/TableList/index.tsx",
                lineNumber: 219,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Modal, {
                title: editingStudent ? "编辑学生信息" : "添加学生",
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
                    initialValues: editingStudent || {},
                    children: [
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "studentId",
                            label: "学号",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入学号'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                placeholder: "请输入学号",
                                disabled: !!editingStudent
                            }, void 0, false, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 258,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 253,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "name",
                            label: "姓名",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入姓名'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                placeholder: "请输入姓名",
                                disabled: !!editingStudent
                            }, void 0, false, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 269,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 264,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "college",
                            label: "学院",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入学院'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                placeholder: "请输入学院"
                            }, void 0, false, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 280,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 275,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "Sex",
                            label: "性别",
                            rules: [
                                {
                                    required: true,
                                    message: '请选择性别'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Select, {
                                children: [
                                    /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Select.Option, {
                                        value: "male",
                                        children: "男"
                                    }, void 0, false, {
                                        fileName: "src/pages/TableList/index.tsx",
                                        lineNumber: 289,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Select.Option, {
                                        value: "female",
                                        children: "女"
                                    }, void 0, false, {
                                        fileName: "src/pages/TableList/index.tsx",
                                        lineNumber: 290,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 288,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 283,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "age",
                            label: "年龄",
                            rules: [
                                {
                                    required: false,
                                    message: '请输入年龄'
                                },
                                {
                                    type: 'number',
                                    min: 0,
                                    max: 120,
                                    message: '请输入有效年龄'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                type: "number",
                                placeholder: "请输入年龄"
                            }, void 0, false, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 302,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 294,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "phone",
                            label: "电话",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入电话'
                                },
                                {
                                    pattern: /^1[3-9]\d{9}$/,
                                    message: '请输入有效的手机号码'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                placeholder: "请输入电话"
                            }, void 0, false, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 313,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 305,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "address",
                            label: "地址",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入地址'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input.TextArea, {
                                placeholder: "请输入地址"
                            }, void 0, false, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 321,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 316,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Form.Item, {
                            name: "zipCode",
                            label: "邮编",
                            rules: [
                                {
                                    required: true,
                                    message: '请输入邮编'
                                },
                                {
                                    pattern: /^\d{6}$/,
                                    message: '请输入有效的邮编'
                                }
                            ],
                            children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Input, {
                                placeholder: "请输入邮编"
                            }, void 0, false, {
                                fileName: "src/pages/TableList/index.tsx",
                                lineNumber: 332,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "src/pages/TableList/index.tsx",
                            lineNumber: 324,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "src/pages/TableList/index.tsx",
                    lineNumber: 248,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "src/pages/TableList/index.tsx",
                lineNumber: 238,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Modal, {
                title: `${selectedStudent === null || selectedStudent === void 0 ? void 0 : selectedStudent.name} 的成绩`,
                open: gradeModalVisible,
                onOk: ()=>setGradeModalVisible(false),
                onCancel: ()=>setGradeModalVisible(false),
                width: 720,
                children: /*#__PURE__*/ (0, _jsxdevruntime.jsxDEV)(_antd.Table, {
                    columns: gradeColumns,
                    dataSource: grades,
                    pagination: false
                }, void 0, false, {
                    fileName: "src/pages/TableList/index.tsx",
                    lineNumber: 344,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "src/pages/TableList/index.tsx",
                lineNumber: 337,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "src/pages/TableList/index.tsx",
        lineNumber: 218,
        columnNumber: 5
    }, this);
};
_s(StudentManagement, "d6c8NJJowxqSaYZxX7GiQfsXz+g=", false, function() {
    return [
        _antd.Form.useForm,
        _ahooks.useRequest
    ];
});
_c = StudentManagement;
var _default = StudentManagement;
var _c;
$RefreshReg$(_c, "StudentManagement");
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
//# sourceMappingURL=p__TableList__index-async.js.map