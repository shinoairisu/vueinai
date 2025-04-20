<template>
  <!-- template标签上方不能写任何东西包括注释 -->
  <!-- 动态载入VUE组件 模板 -->
  <!-- 文档 https://www.npmjs.com/package/http-vue-loader -->
  <!-- 仓库 https://github.com/FranckFreiburger/http-vue-loader，本项目使用的是修复过bug的版本，与仓库不同-->
  <!-- vue组件与事件总线模板 -->
  <!-- template下只允许有一个根节点 比如div -->
  <div>
    <h1>{{ name }}</h1>
    <h2>{{ schoolname1 }}</h2>
    <h2>{{ schoolname2 }}</h2>
    <!-- <button @click="tes1">tes1</button> -->
  </div>
</template>
  
  <script>
module.exports = {
  // 这种动态载入的只能使用这种方式
  name: "tes1", // 保持和*.vue的文件名一致，防止有问题
  // 这里可以写成数组，比如 props:['参数1', '参数2] 但这样就没法配置默认值
  // 属性名字不能含有大写、空格、特殊字符，否则会报错
  props: {
    // 这里可以定义属性默认值。没定义的属性是父组件必填的（因为没定义就更没有默认值了）。
    schoolname1: {
      // 属性名和默认值。这种传参是父组件传参，不是路由传参。
      type: String,
      default: "试一试默认值",
    },
    schoolname2: {
      // 属性名和默认值。这种传参是父组件传参，不是路由传参。
      type: String,
      default: "试一试默认值2",
    },
  },
  data() {
    return {
      name: "tes1",
    };
  },
  methods: {
    tes1() {
      console.log("tes1");
    },
  },
};
</script>
  
  <!-- scoped指的是css只对当前组件有效 -->
<style scoped>
</style>