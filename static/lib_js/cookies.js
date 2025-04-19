function setCookie(name, value, iDay) {
    var oDate = new Date();
    oDate.setDate(oDate.getDate() + iDay);
    document.cookie = name + '=' + value + ';expires=' + oDate + ";path=/";
    // 如果服务器设置了一个 cookie，其 Path 为 /user，那么只有当请求的 URL 路径以 /user 开头时，浏览器才会发送该 cookie。
    // 如果 Path 为 /，则该 cookie 对所有路径都有效。所以尽量都用/。大厂都这么设置。
};
/*使用方法：setCookie('user', 'simon', 11);*/
/*获取cookie*/
// 获取cookie时不需要使用路径path，因为cookie是存储在客户端的，所以只要浏览器能访问到，就可以获取到cookie。
function getCookie(name) {
    var arr = document.cookie.split('; ');//多个cookie值是以; 分隔的，用split把cookie分割开并赋值给数组
    for (var i = 0; i < arr.length; i++) {//历遍数组
        var ars = arr[i].split('=');//原来割好的数组是：user=simon，再用split('=')分割成：user simon 这样可以通过arr2[0] arr2[1]来分别获取user和simon
        if (ars[0] == name) {//如果数组的属性名等于传进来的name
            return ars[1];//就返回属性名对应的值
        }
    }
    return ''; //没找到就返回空
}
/*使用方法：getCookie('user')*/
/*删除cookie*/
function removeCookie(name) {
    setCookie(name, 1, -1); //-1就是告诉系统已经过期，系统就会立刻去删除cookie
};
/*使用方法：removeCookie('user')*/