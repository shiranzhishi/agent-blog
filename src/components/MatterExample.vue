<script setup lang="ts">
// 导入 Vue 相关的组合式 API
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
// 添加类型声明
import Matter from 'matter-js';
const { MouseConstraint, Mouse, Engine, Render, Bodies, Composite, Runner } = Matter;

const MatterExample = ref(null)
const test = () => {
    // 3. 创建引擎
    let engine = Engine.create()

    // 4. 创建渲染器，并将引擎连接到画布上
    let render = Render.create({
        element: MatterExample.value, // 绑定页面元素
        engine: engine, // 绑定引擎
        options: {
            width: 800,
            height: 600,
            wireframes: false
        }
    })

    // 创建弹弓固定点（静止）
    let pointA = Bodies.circle(100, 400, 10, { isStatic: true, render: { fillStyle: 'black' } });
    let pointB = Bodies.circle(300, 400, 10, { isStatic: true, render: { fillStyle: 'black' } });

    // 创建弹弓的条状物
    let slingshotBar = Bodies.rectangle(200, 400, 100, 5, {
        render: {
            fillStyle: 'brown'
        }
    });

    // 创建球体（弹丸）
    let ball = Bodies.circle(180, 350, 20, {
        density: 0.04,
        restitution: 0.8,
        render: {
            fillStyle: 'red'
        }
    });

    // 5-2. 创建地面，将isStatic设为true，表示物体静止
    let ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true })

    // 创建弹性线（使用Constraint）并连接到条状物的两端
    const elastic1 = Matter.Constraint.create({
        bodyA: pointA,
        bodyB: slingshotBar,
        pointB: { x: -50, y: 0 }, // 连接到条状物的左端（相对于中心左移15个单位）
        length: 100,
        stiffness: 0.1,
        render: {
            strokeStyle: 'green',
            lineWidth: 2
        }
    });

    const elastic2 = Matter.Constraint.create({
        bodyA: pointB,
        bodyB: slingshotBar,
        pointB: { x: 50, y: 0 }, // 连接到条状物的右端（相对于中心右移15个单位）
        length: 100,
        stiffness: 0.1,
        render: {
            strokeStyle: 'green',
            lineWidth: 2
        }
    });

    // 创建鼠标约束
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: { visible: false }
        }
    });

    // 6. 将所有物体添加到世界中
    Composite.add(engine.world, [pointA, pointB, slingshotBar, ball, ground, elastic1, elastic2, mouseConstraint])

    // 7. 执行渲染操作
    Render.run(render)

    // 8. 创建运行方法
    const runner = Runner.create()

    // 9. 运行渲染器
    Runner.run(runner, engine)
}

// 生命周期钩子
onMounted(() => {
    test()
    console.log('组件已挂载');
});

onUnmounted(() => {
    console.log('组件已卸载');
});
</script>

<template>
    <div id="MatterExample" ref="MatterExample" style="width: 800px;height: 600px;">
    </div>
</template>

<style scoped></style>
