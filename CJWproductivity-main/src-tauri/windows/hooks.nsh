; ============================================================================
; CJWproductivity NSIS Installer Hooks
; 专业级安装器自定义脚本 - Tauri 兼容版本
; ============================================================================

; ============================================================================
; 预安装钩子 - 安装前执行
; ============================================================================
!macro NSIS_HOOK_PREINSTALL
  ; 显示安装进度信息
  DetailPrint "正在准备安装 CJWproductivity..."
  DetailPrint "Preparing to install CJWproductivity..."
!macroend

; ============================================================================
; 安装后钩子 - 安装完成后执行
; ============================================================================
!macro NSIS_HOOK_POSTINSTALL
  ; 创建桌面快捷方式
  CreateShortCut "$DESKTOP\CJWproductivity.lnk" "$INSTDIR\CJWproductivity.exe" "" "$INSTDIR\CJWproductivity.exe" 0
  DetailPrint "已创建桌面快捷方式 / Desktop shortcut created"

  ; 创建开始菜单文件夹和快捷方式
  CreateDirectory "$SMPROGRAMS\CJWproductivity"
  CreateShortCut "$SMPROGRAMS\CJWproductivity\CJWproductivity.lnk" "$INSTDIR\CJWproductivity.exe" "" "$INSTDIR\CJWproductivity.exe" 0
  CreateShortCut "$SMPROGRAMS\CJWproductivity\卸载 CJWproductivity.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
  DetailPrint "已创建开始菜单快捷方式 / Start menu shortcuts created"

  ; 写入额外的注册表信息（增强"程序和功能"显示）
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\CJWproductivity" "DisplayIcon" "$INSTDIR\CJWproductivity.exe,0"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\CJWproductivity" "Publisher" "CJW"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\CJWproductivity" "URLInfoAbout" "https://github.com/cjw-charern"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\CJWproductivity" "HelpLink" "https://github.com/cjw-charern"
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\CJWproductivity" "Comments" "零阻力任务管理工具 / Zero-friction Task Management"
  WriteRegDWORD SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\CJWproductivity" "NoModify" 1
  WriteRegDWORD SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\CJWproductivity" "NoRepair" 1
  DetailPrint "已更新注册表信息 / Registry updated"

  ; 刷新系统图标缓存
  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, p 0, p 0)'
  
  DetailPrint "=========================================="
  DetailPrint "安装完成！/ Installation completed!"
  DetailPrint "=========================================="
!macroend

; ============================================================================
; 预卸载钩子 - 卸载前执行
; ============================================================================
!macro NSIS_HOOK_PREUNINSTALL
  DetailPrint "正在准备卸载 CJWproductivity..."
  DetailPrint "Preparing to uninstall CJWproductivity..."
!macroend

; ============================================================================
; 卸载后钩子 - 卸载完成后执行
; ============================================================================
!macro NSIS_HOOK_POSTUNINSTALL
  ; 删除桌面快捷方式
  Delete "$DESKTOP\CJWproductivity.lnk"
  DetailPrint "已删除桌面快捷方式 / Desktop shortcut removed"
  
  ; 删除开始菜单快捷方式
  Delete "$SMPROGRAMS\CJWproductivity\CJWproductivity.lnk"
  Delete "$SMPROGRAMS\CJWproductivity\卸载 CJWproductivity.lnk"
  RMDir "$SMPROGRAMS\CJWproductivity"
  DetailPrint "已删除开始菜单快捷方式 / Start menu shortcuts removed"
  
  ; 删除可能存在的开机自启动项
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "CJWproductivity"
  DetailPrint "已清理注册表 / Registry cleaned"

  ; 刷新系统图标缓存
  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, p 0, p 0)'
  
  ; 提示用户数据位置
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "卸载完成！$\n$\n是否删除应用程序数据（任务、笔记和设置）？$\n$\nUninstallation completed!$\nDelete application data (tasks, notes, settings)?" \
    IDYES delete_data IDNO keep_data
    
  delete_data:
    RMDir /r "$LOCALAPPDATA\com.cjwproductivity.app"
    RMDir /r "$APPDATA\com.cjwproductivity.app"
    DetailPrint "已删除用户数据 / User data deleted"
    Goto done
    
  keep_data:
    DetailPrint "用户数据已保留 / User data preserved"
    DetailPrint "数据位置 / Data location: $LOCALAPPDATA\com.cjwproductivity.app"
    
  done:
  DetailPrint "=========================================="
  DetailPrint "卸载完成！/ Uninstallation completed!"
  DetailPrint "=========================================="
!macroend
