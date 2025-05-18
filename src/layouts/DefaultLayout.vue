<template>
  <el-container class="layout-container">
    <el-aside width="180px" class="glass-aside">
      <div class="logo">
        <h2>小汪有料</h2>
        <p>进销存管理系统</p>
      </div>

      <!-- 移动到此处的用户信息 -->
      <div class="user-info-sidebar">
        <el-dropdown>
          <span class="user-dropdown">
            {{ userStore.currentUser?.username }}
            <el-icon><CaretBottom /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="viewUserInfo">个人信息</el-dropdown-item>
              <el-dropdown-item @click="changePassword">修改密码</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <el-menu
        :router="true"
        :default-active="route.path"
        class="glass-menu"
      >
        <el-menu-item index="/">
          <el-icon><DataLine /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>

        <el-menu-item index="/inventory">
          <el-icon><Box /></el-icon>
          <span>库存管理</span>
        </el-menu-item>

        <el-menu-item index="/sales">
          <el-icon><ShoppingCart /></el-icon>
          <span>销售管理</span>
        </el-menu-item>

        <el-menu-item index="/tutorial">
          <el-icon><QuestionFilled /></el-icon>
          <span>使用教程</span>
        </el-menu-item>

        <!-- 设置下拉菜单 -->
        <el-sub-menu index="settings" v-permission="'settings.view'">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>

          <el-menu-item index="/materials">
            <el-icon><List /></el-icon>
            <span>物料管理</span>
          </el-menu-item>

          <el-menu-item index="/stores">
            <el-icon><Shop /></el-icon>
            <span>门店管理</span>
          </el-menu-item>

          <el-menu-item index="/users" v-permission="'user.view'">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>

          <!-- 暂时隐藏调拨价格管理，后续可能会用到 -->
          <!-- <el-menu-item index="/prices">
            <el-icon><Money /></el-icon>
            <span>调拨价格管理</span>
          </el-menu-item> -->

          <el-menu-item index="/dishes">
            <el-icon><Bowl /></el-icon>
            <span>菜品管理</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-main class="glass-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="400px"
      destroy-on-close
    >
      <el-form :model="passwordForm" label-position="top">
        <el-form-item label="原密码">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item label="确认新密码">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            autocomplete="off"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="submitPasswordChange"
            :loading="passwordFormLoading"
          >
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataLine,
  Box,
  List,
  ShoppingCart,
  CaretBottom,
  Money,
  Bowl,
  Setting,
  Shop,
  User,
  QuestionFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

// 查看用户信息
const viewUserInfo = () => {
  const user = userStore.currentUser
  if (!user) return

  ElMessageBox.alert(
    `<div>
      <p><strong>用户名:</strong> ${user.username}</p>
      <p><strong>角色:</strong> ${getRoleName(user.role)}</p>
      ${user.store_name ? `<p><strong>所属门店:</strong> ${user.store_name}</p>` : ''}
      ${user.created_at ? `<p><strong>创建时间:</strong> ${new Date(user.created_at).toLocaleString()}</p>` : ''}
    </div>`,
    '个人信息',
    {
      confirmButtonText: '关闭',
      dangerouslyUseHTMLString: true,
    }
  )
}

// 角色名称映射
const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    'admin': '系统管理员',
    'store_manager': '门店经理',
    'purchaser': '采购员'
  }
  return roleMap[role] || role
}

// 修改密码对话框状态
const passwordDialogVisible = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordFormLoading = ref(false)

// 修改密码
const changePassword = () => {
  // 打开对话框并重置表单
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordDialogVisible.value = true
}

// 提交修改密码
const submitPasswordChange = async () => {
  // 表单验证
  if (!passwordForm.value.oldPassword) {
    ElMessage.warning('请输入原密码')
    return
  }
  if (!passwordForm.value.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    ElMessage.warning('新密码长度不能小于6个字符')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  try {
    passwordFormLoading.value = true
    await userStore.changePassword(
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword
    )
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error(`修改密码失败: ${error.message || '未知错误'}`)
    }
  } finally {
    passwordFormLoading.value = false
  }
}
</script>

<style scoped>
/* Flat Remix 风格的配色变量 */
:root {
  --sidebar-bg: #2f343f;       /* Flat Remix 特征深色背景 */
  --sidebar-hover: #383c4a;    /* 侧边栏悬停色 */
  --sidebar-active: #404552;   /* 侧边栏激活色 */
  --header-bg: #2f343f;        /* 顶栏背景色 */
  --text-light: #d3dae3;       /* 浅色文字 */
  --text-muted: #7c818c;       /* 次要文字 */
}

.layout-container {
  min-height: 100vh;
  background: var(--background-color);
  display: flex;
}

.glass-aside {
  background: var(--sidebar-bg);
  border-right: 1px solid rgba(0, 0, 0, 0.2);
  padding: 0;
  flex-shrink: 0;
}

.logo {
  padding: 16px;
  text-align: center;
  color: var(--text-light);
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

.logo h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: var(--text-light);
}

.logo p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

/* 侧边栏用户信息样式 */
.user-info-sidebar {
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

.glass-menu {
  background: var(--sidebar-bg);
}

.glass-menu :deep(.el-menu-item) {
  color: var(--text-light);
  height: 50px;
  line-height: 50px;
  padding: 0 20px;
  margin: 4px 0;
}

.glass-menu :deep(.el-menu-item.is-active) {
  background: var(--sidebar-active);
  color: var(--text-light);
  box-shadow: inset 3px 0 0 var(--primary-color);
}

.glass-main {
  background-color: var(--background-color);
  padding: 20px;
  height: 100vh; /* 调整高度，去掉header后占满 */
  overflow: auto;
}

.main-container {
  height: 100vh;
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Logo 样式 */
.logo {
  padding: 16px;
  font-size: 20px;
  font-weight: 500;
  color: var(--text-light);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* 菜单图标样式 */
.glass-menu :deep(.el-menu-item .el-icon) {
  color: var(--text-muted);
  margin-right: 16px;
  font-size: 18px;
}

.glass-menu :deep(.el-menu-item:hover .el-icon),
.glass-menu :deep(.el-menu-item.is-active .el-icon) {
  color: var(--text-light);
}

/* 子菜单样式 */
.glass-menu :deep(.el-sub-menu__title) {
  color: var(--text-light);
  height: 50px;
  line-height: 50px;
  padding: 0 20px;
  margin: 4px 0;
}

.glass-menu :deep(.el-sub-menu__title:hover) {
  background: var(--sidebar-hover);
}

.glass-menu :deep(.el-sub-menu.is-active .el-sub-menu__title) {
  color: var(--text-light);
}

.glass-menu :deep(.el-sub-menu .el-icon) {
  color: var(--text-muted);
  margin-right: 16px;
  font-size: 18px;
}

.glass-menu :deep(.el-sub-menu:hover .el-icon),
.glass-menu :deep(.el-sub-menu.is-active .el-icon) {
  color: var(--text-light);
}

.glass-menu :deep(.el-menu--inline) {
  background: var(--sidebar-active);
  padding: 5px 0;
}

.glass-menu :deep(.el-menu--inline .el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin: 2px 0;
  padding-left: 40px !important;
}

/* 用户下拉菜单样式 */
.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-light);
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-dropdown:hover {
  background: var(--sidebar-hover);
}

.user-dropdown :deep(.el-dropdown-menu) {
  background: var(--sidebar-bg);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin-top: 8px;
  padding: 4px 0;
}

.user-dropdown :deep(.el-dropdown-menu__item) {
  color: var(--text-light);
  padding: 8px 16px;
  font-size: 14px;
}
</style>