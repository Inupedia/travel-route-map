<template>
  <div class="location-form">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" @submit.prevent="handleSubmit">
      <el-form-item label="地点名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入地点名称" clearable />
      </el-form-item>

      <el-form-item label="地点类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择地点类型" style="width: 100%">
          <el-option label="出发点" value="start" :disabled="isStartDisabled" />
          <el-option label="途经点" value="waypoint" />
          <el-option label="终点" value="end" :disabled="isEndDisabled" />
        </el-select>
      </el-form-item>

      <el-form-item label="坐标" prop="coordinates">
        <div class="coordinates-input">
          <el-input v-model="formData.coordinates.lat" placeholder="纬度" type="number" step="any" style="width: 48%" />
          <span style="width: 4%; text-align: center; display: inline-block">,</span>
          <el-input v-model="formData.coordinates.lng" placeholder="经度" type="number" step="any" style="width: 48%" />
        </div>
      </el-form-item>

      <el-form-item label="地址" prop="address">
        <el-input v-model="formData.address" placeholder="请输入详细地址（可选）" clearable />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入地点描述（可选）" />
      </el-form-item>

      <el-form-item label="标签" prop="tags">
        <el-tag v-for="tag in formData.tags" :key="tag" closable @close="removeTag(tag)"
          style="margin-right: 8px; margin-bottom: 8px">
          {{ tag }}
        </el-tag>
        <el-input v-if="inputVisible" ref="inputRef" v-model="inputValue" size="small" style="width: 100px"
          @keyup.enter="handleInputConfirm" @blur="handleInputConfirm" />
        <el-button v-else size="small" @click="showInput">
          + 添加标签
        </el-button>
      </el-form-item>

      <el-form-item label="天数安排" prop="dayNumber">
        <el-select v-model="formData.dayNumber" placeholder="请选择天数（可选）" clearable style="width: 100%">
          <el-option v-for="day in availableDays" :key="day" :label="`第${day}天`" :value="day" />
        </el-select>
      </el-form-item>

      <el-form-item label="游览时长" prop="visitDuration">
        <el-input-number v-model="formData.visitDuration" :min="0" :max="1440" :step="30" placeholder="分钟"
          style="width: 100%" />
        <div class="form-help-text">预计游览时长（分钟）</div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
          {{ isEdit ? '更新地点' : '添加地点' }}
        </el-button>
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button v-if="isEdit" type="danger" @click="handleDelete" :loading="isDeleting">
          删除地点
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { usePlanStore } from '@/stores/planStore'
import type { Location, LocationType } from '@/types'

interface Props {
  location?: Location | null
  visible?: boolean
}

interface Emits {
  (e: 'submit', location: Partial<Location>): void
  (e: 'cancel'): void
  (e: 'delete', locationId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  location: null,
  visible: false
})

const emit = defineEmits<Emits>()

const planStore = usePlanStore()

// Form refs
const formRef = ref<FormInstance>()
const inputRef = ref()

// Form state
const isSubmitting = ref(false)
const isDeleting = ref(false)

// Tag input state
const inputVisible = ref(false)
const inputValue = ref('')

// Form data
const formData = ref({
  name: '',
  type: 'waypoint' as LocationType,
  coordinates: {
    lat: '',
    lng: ''
  },
  address: '',
  description: '',
  tags: [] as string[],
  dayNumber: undefined as number | undefined,
  visitDuration: undefined as number | undefined
})

// Computed properties
const isEdit = computed(() => !!props.location)

const isStartDisabled = computed(() => {
  if (isEdit.value && props.location?.type === 'start') {
    return false
  }
  return !!planStore.startLocation
})

const isEndDisabled = computed(() => {
  if (isEdit.value && props.location?.type === 'end') {
    return false
  }
  return !!planStore.endLocation
})

const availableDays = computed(() => {
  const totalDays = planStore.currentPlan?.totalDays || 1
  return Array.from({ length: totalDays }, (_, i) => i + 1)
})

// Form validation rules
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入地点名称', trigger: 'blur' },
    { min: 1, max: 50, message: '地点名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择地点类型', trigger: 'change' }
  ],
  coordinates: [
    {
      validator: (rule, value, callback) => {
        if (!value.lat || !value.lng) {
          callback(new Error('请输入完整的坐标信息'))
          return
        }

        const lat = parseFloat(value.lat)
        const lng = parseFloat(value.lng)

        if (isNaN(lat) || isNaN(lng)) {
          callback(new Error('坐标必须是有效的数字'))
          return
        }

        if (lat < -90 || lat > 90) {
          callback(new Error('纬度必须在 -90 到 90 之间'))
          return
        }

        if (lng < -180 || lng > 180) {
          callback(new Error('经度必须在 -180 到 180 之间'))
          return
        }

        callback()
      },
      trigger: 'blur'
    }
  ]
}

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    type: 'waypoint',
    coordinates: {
      lat: '',
      lng: ''
    },
    address: '',
    description: '',
    tags: [],
    dayNumber: undefined,
    visitDuration: undefined
  }
  formRef.value?.clearValidate()
}

// Watch for location prop changes
watch(() => props.location, (newLocation) => {
  if (newLocation) {
    formData.value = {
      name: newLocation.name,
      type: newLocation.type,
      coordinates: {
        lat: newLocation.coordinates.lat.toString(),
        lng: newLocation.coordinates.lng.toString()
      },
      address: newLocation.address || '',
      description: newLocation.description || '',
      tags: [...(newLocation.tags || [])],
      dayNumber: newLocation.dayNumber,
      visitDuration: newLocation.visitDuration
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    isSubmitting.value = true

    const locationData: Partial<Location> = {
      name: formData.value.name.trim(),
      type: formData.value.type,
      coordinates: {
        lat: parseFloat(formData.value.coordinates.lat),
        lng: parseFloat(formData.value.coordinates.lng)
      },
      address: formData.value.address?.trim() || undefined,
      description: formData.value.description?.trim() || undefined,
      tags: formData.value.tags.length > 0 ? formData.value.tags.filter(tag => tag.trim().length > 0).map(tag => tag.trim()) : undefined,
      dayNumber: formData.value.dayNumber,
      visitDuration: formData.value.visitDuration
    }

    emit('submit', locationData)

    if (!isEdit.value) {
      resetForm()
    }

    ElMessage.success(isEdit.value ? '地点更新成功' : '地点添加成功')
  } catch (error) {
    console.error('Form validation failed:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}

const handleDelete = async () => {
  if (!props.location) return

  try {
    await ElMessageBox.confirm(
      '确定要删除这个地点吗？删除后将无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    isDeleting.value = true
    emit('delete', props.location.id)
    ElMessage.success('地点删除成功')
  } catch {
    // User cancelled
  } finally {
    isDeleting.value = false
  }
}

// Tag management
const removeTag = (tag: string) => {
  const index = formData.value.tags.indexOf(tag)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  }
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleInputConfirm = () => {
  const value = inputValue.value.trim()
  if (value && !formData.value.tags.includes(value)) {
    formData.value.tags.push(value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

// Expose methods for parent component
defineExpose({
  resetForm,
  validate: () => formRef.value?.validate()
})
</script>

<style scoped lang="scss">
.location-form {
  .coordinates-input {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-help-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  .el-tag {
    margin-right: 8px;
    margin-bottom: 8px;
  }
}
</style>