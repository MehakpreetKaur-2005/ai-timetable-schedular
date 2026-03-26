import { NavLink, useLocation } from 'react-router-dom';
import {
    HiOutlineSquares2X2, HiOutlineBuildingOffice2, HiOutlineUserGroup,
    HiOutlineBookOpen, HiOutlineRectangleGroup, HiOutlineHomeModern,
    HiOutlineClock, HiOutlineAdjustmentsHorizontal, HiOutlineCpuChip,
    HiOutlineTableCells, HiOutlinePencilSquare, HiOutlineChartBarSquare,
    HiOutlineUser, HiOutlineChevronLeft, HiOutlineChevronRight
} from 'react-icons/hi2';
import { useState } from 'react';

const navGroups = [
    {
        label: 'Overview',
        links: [
            { to: '/admin', icon: <HiOutlineSquares2X2 />, label: 'Dashboard', end: true },
        ],
    },
    {
        label: 'Management',
        links: [
            { to: '/admin/departments', icon: <HiOutlineBuildingOffice2 />, label: 'Departments' },
            { to: '/admin/faculty', icon: <HiOutlineUserGroup />, label: 'Faculty' },
            { to: '/admin/subjects', icon: <HiOutlineBookOpen />, label: 'Subjects' },
            { to: '/admin/sections', icon: <HiOutlineRectangleGroup />, label: 'Sections' },
            { to: '/admin/rooms', icon: <HiOutlineHomeModern />, label: 'Rooms & Labs' },
            { to: '/admin/time-slots', icon: <HiOutlineClock />, label: 'Time Slots' },
        ],
    },
    {
        label: 'Scheduling',
        links: [
            { to: '/admin/workload', icon: <HiOutlineAdjustmentsHorizontal />, label: 'Workload' },
            { to: '/admin/generate', icon: <HiOutlineCpuChip />, label: 'Generate' },
            { to: '/admin/timetable', icon: <HiOutlineTableCells />, label: 'View Timetable' },
        ],
    },
    {
        label: 'System',
        links: [
            { to: '/admin/analytics', icon: <HiOutlineChartBarSquare />, label: 'Analytics' },
            { to: '/admin/profile', icon: <HiOutlineUser />, label: 'Profile' },
        ],
    },
];

export default function Sidebar({ collapsed, onToggle }) {
    return (
        <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
            <div className="sidebar__logo">
                <div className="sidebar__logo-icon">
                    <HiOutlineCpuChip />
                </div>
                <div className="sidebar__logo-text">
                    Sched<span>ulAI</span>
                </div>
            </div>

            <nav className="sidebar__nav">
                {navGroups.map(group => (
                    <div className="sidebar__group" key={group.label}>
                        <div className="sidebar__group-label">{group.label}</div>
                        {group.links.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                className={({ isActive }) =>
                                    `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                                }
                            >
                                <span className="sidebar__link-icon">{link.icon}</span>
                                <span>{link.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar__toggle">
                <button className="sidebar__toggle-btn" onClick={onToggle}>
                    {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronLeft />}
                </button>
            </div>
        </aside>
    );
}
