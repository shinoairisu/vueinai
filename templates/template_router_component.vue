<template>
    <!-- 路由 vue组件示例模板 -->
    <!-- template标签上方不能写任何东西包括注释 -->
    <div>
        <div id="tese">
            你好，我是{{ name }},
            {{ first }}
            <!--  路由传参这样传参，是使用查询语句传参的，比如 /foo?xxx=yyy&ccc=ddd -->
            {{ $route.query.id }} 
        </div>
    </div>
</template>

<script>
module.exports =  { // 这种动态载入的只能使用这种方式
    name: 'tes1',// 保持和*.vue的文件名一致，防止有问题
    // 这里可以写成数组，比如 props:['参数1', '参数2] 但这样就没法配置默认值
    // 属性名字不能含有大写、空格、特殊字符，否则会报错
    props:{ // 这里可以定义属性默认值。没定义的属性是父组件必填的（因为没定义就更没有默认值了）。
        first:{ // 属性名和默认值。这种传参是父组件传参，不是路由传参。
            type: String,
            default: '试一试默认值'
        }
    },
    mounted() {
        console.log(this.$route)
    },
    data() {
        return {
            name: 'tes1'
        }
    },
    methods: {
        tes1() {
            console.log('tes1')
        }
    }
}
</script>
<!-- 带有scoped标签，css就只影响当前元素 -->
<style scoped>

</style>