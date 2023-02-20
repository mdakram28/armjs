use std::ops;

use js_sys::Math::log2;

use crate::{logfmt, util::log};

const PAGE_TABLE_SIZE: usize = 0x1000;
const PAGE_TABLE_ENTRIES: usize = 1024;

enum PageTableEntryEnum {
    ZERO,
    VEC,
}

trait PageTableEntry: ops::IndexMut<usize, Output = u8> {
    fn get_type(&self) -> PageTableEntryEnum;
}

type PageTableEntryType = Box<dyn PageTableEntry>;

struct PageZero {
    val: u8,
}

impl ops::Index<usize> for PageZero {
    type Output = u8;

    fn index(&self, index: usize) -> &Self::Output {
        &0
    }
}

impl ops::IndexMut<usize> for PageZero {
    fn index_mut<'a>(&mut self, index: usize) -> &mut Self::Output {
        &mut self.val
    }
}

impl PageTableEntry for PageZero {
    fn get_type(&self) -> PageTableEntryEnum {
        PageTableEntryEnum::ZERO
    }
}

impl PageTableEntry for Vec<u8> {
    fn get_type(&self) -> PageTableEntryEnum {
        PageTableEntryEnum::VEC
    }
}

pub struct PageTable {
    table: Vec<PageTableEntryType>,
}

impl PageTable {
    pub fn new() -> PageTable {
        PageTable {
            table: Vec::with_capacity(PAGE_TABLE_SIZE),
        }
    }
}

impl ops::Index<usize> for PageTable {
    type Output = u8;

    fn index(&self, index: usize) -> &Self::Output {
        let page_index = index >> 12;
        if page_index >= self.table.len() {
            return &0
        }
        return &self.table[page_index][index & 0xFFF];
    }
}

impl ops::IndexMut<usize> for PageTable {
    fn index_mut(&mut self, index: usize) -> &mut Self::Output {
        // log(format!("Modifying PT index = {index}").as_str());
        let page_index = index >> 12;
        if page_index >= self.table.len() {
            for _ in self.table.len()..=page_index {
                self.table.push(Box::new(PageZero { val: 0 }))
            }
            // log(format!("New PT Length = {}", self.table.len()).as_str());
        }
        match self.table[page_index].get_type() {
            PageTableEntryEnum::ZERO => {
                self.table[page_index] = Box::new(vec![0; PAGE_TABLE_SIZE]);
                log(format!("Inserted page table entry vec ").as_str());
            }
            _ => {}
        };
        return &mut self.table[page_index][index & 0xFFF];
    }
}
