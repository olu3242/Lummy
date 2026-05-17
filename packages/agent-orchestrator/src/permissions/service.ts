export class AgentPermissionService {
  assert(permissionList: string[], required: string) {
    if (!permissionList.includes(required)) throw new Error(`Agent missing permission: ${required}`)
  }
}
