import { defineConfig } from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';

const { REACT_APP_ENV = 'dev' } = process.env;

export default defineConfig({
  hash: true,
  routes: [
    {
      path: '/user',
      layout: false,
      routes: [{ name: 'login', path: '/user/login', component: './User/Login' }],
    },
    {
      name: '学生管理',
      icon: 'team',
      path: '/admin/students',
      component: './TableList',
      access: 'canAdmin',
    },
    {
      name: '课程管理',
      icon: 'table',
      path: '/admin/courses',
      component: './Courses',
      access: 'canAdmin',
    },
    {
      name: '授课与成绩',
      icon: 'solution',
      path: '/teacher/courses',
      component: './TeacherCourses',
      access: 'canTeacher',
    },
    {
      name: '我的选课',
      icon: 'book',
      path: '/student/courses',
      component: './StudentCourses',
      access: 'canStudent',
    },
    { path: '/', component: './RoleRedirect' },
    { path: '*', layout: false, component: './404' },
  ],
  proxy: proxy[REACT_APP_ENV as keyof typeof proxy],
  fastRefresh: true,
  model: {},
  initialState: {},
  title: '学生选课管理系统',
  layout: { locale: false, ...defaultSettings },
  antd: {},
  access: {},
  headScripts: [{ src: '/scripts/loading.js', async: true }],
  presets: ['umi-presets-pro'],
  mako: {},
  esbuildMinifyIIFE: true,
});
